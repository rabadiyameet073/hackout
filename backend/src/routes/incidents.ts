import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '@/config/database';
import { RedisService } from '@/config/redis';
import { asyncHandler, validationError, notFoundError, forbiddenError } from '@/middleware/errorHandler';
import { authenticate, authorize, optionalAuth, AuthenticatedRequest } from '@/middleware/auth';
import { logger, loggerHelpers } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = express.Router();

// Validation rules
const createIncidentValidation = [
  body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('type').isIn(['illegal_cutting', 'pollution', 'land_reclamation', 'wildlife_disturbance', 'other']).withMessage('Invalid incident type'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('location.address').optional().isLength({ max: 500 }).withMessage('Address too long'),
  body('images').isArray({ max: 5 }).withMessage('Maximum 5 images allowed'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Maximum 10 tags allowed')
];

const updateIncidentValidation = [
  body('title').optional().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').optional().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('type').optional().isIn(['illegal_cutting', 'pollution', 'land_reclamation', 'wildlife_disturbance', 'other']).withMessage('Invalid incident type'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('status').optional().isIn(['pending', 'under_review', 'verified', 'rejected', 'resolved']).withMessage('Invalid status')
];

// @desc    Create new incident report
// @route   POST /api/incidents
// @access  Private
router.post('/', authenticate, createIncidentValidation, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError(errors.array().map(err => err.msg).join(', '));
  }

  const userId = req.user!.id;
  const { title, description, type, severity, location, images = [], tags = [] } = req.body;

  // Create incident
  const incidentId = uuidv4();
  const incidentData = {
    id: incidentId,
    user_id: userId,
    title,
    description,
    type,
    severity,
    location,
    images,
    status: 'pending',
    validation_score: 0,
    ai_confidence: 0,
    tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: incident, error } = await supabase
    .from('incidents')
    .insert(incidentData)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create incident:', error);
    throw new Error('Failed to create incident report');
  }

  // Cache incident data
  await RedisService.cacheIncident(incidentId, incident);

  // Award points for reporting
  const pointsEarned = parseInt(process.env.POINTS_PER_REPORT || '10');
  await supabase
    .from('users')
    .update({ 
      points: supabase.raw(`points + ${pointsEarned}`),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Log gamification event
  await supabase
    .from('gamification')
    .insert({
      id: uuidv4(),
      user_id: userId,
      action_type: 'report_incident',
      points_earned: pointsEarned,
      created_at: new Date().toISOString()
    });

  // Trigger AI validation if images are provided
  if (images.length > 0) {
    try {
      await axios.post(`${process.env.AI_SERVICE_URL}/validate-incident`, {
        incidentId,
        images,
        type,
        location
      });
    } catch (error) {
      logger.error('Failed to trigger AI validation:', error);
    }
  }

  loggerHelpers.logIncidentReport(incidentId, userId, type, location);

  res.status(201).json({
    success: true,
    message: 'Incident reported successfully',
    data: { incident }
  });
}));

// @desc    Get all incidents with filtering and pagination
// @route   GET /api/incidents
// @access  Public (with optional auth for personalized results)
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    severity,
    status,
    lat,
    lng,
    radius = 10, // km
    user_id,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  // Build query
  let query = supabase
    .from('incidents')
    .select(`
      *,
      users!incidents_user_id_fkey(username, full_name),
      validations(count)
    `, { count: 'exact' });

  // Apply filters
  if (type) query = query.eq('type', type);
  if (severity) query = query.eq('severity', severity);
  if (status) query = query.eq('status', status);
  if (user_id) query = query.eq('user_id', user_id);

  // Geospatial filtering
  if (lat && lng) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusKm = Number(radius);
    
    // Use PostGIS for geospatial queries
    query = query.rpc('incidents_within_radius', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm
    });
  }

  // Sorting
  const validSortFields = ['created_at', 'updated_at', 'validation_score', 'severity'];
  const sortField = validSortFields.includes(sort as string) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? true : false;
  
  query = query.order(sortField as string, { ascending: sortOrder });

  // Pagination
  query = query.range(offset, offset + Number(limit) - 1);

  const { data: incidents, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch incidents:', error);
    throw new Error('Failed to fetch incidents');
  }

  res.json({
    success: true,
    data: {
      incidents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    }
  });
}));

// @desc    Get single incident by ID
// @route   GET /api/incidents/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Try to get from cache first
  let incident = await RedisService.getCachedIncident(id);

  if (!incident) {
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        users!incidents_user_id_fkey(username, full_name, points, level),
        validations(
          id,
          validator_id,
          validation_type,
          score,
          comments,
          created_at,
          users!validations_validator_id_fkey(username, full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw notFoundError('Incident not found');
    }

    incident = data;
    await RedisService.cacheIncident(id, incident);
  }

  res.json({
    success: true,
    data: { incident }
  });
}));

// @desc    Update incident
// @route   PUT /api/incidents/:id
// @access  Private (owner or admin)
router.put('/:id', authenticate, updateIncidentValidation, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError(errors.array().map(err => err.msg).join(', '));
  }

  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Get existing incident
  const { data: existingIncident, error: fetchError } = await supabase
    .from('incidents')
    .select('user_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !existingIncident) {
    throw notFoundError('Incident not found');
  }

  // Check permissions
  const isOwner = existingIncident.user_id === userId;
  const isAdmin = ['admin', 'validator'].includes(userRole);

  if (!isOwner && !isAdmin) {
    throw forbiddenError('Not authorized to update this incident');
  }

  // Owners can only update if status is pending
  if (isOwner && !isAdmin && existingIncident.status !== 'pending') {
    throw forbiddenError('Cannot update incident after it has been reviewed');
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data: incident, error } = await supabase
    .from('incidents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update incident:', error);
    throw new Error('Failed to update incident');
  }

  // Clear cache
  await RedisService.del(`incident:${id}`);

  loggerHelpers.logUserAction(userId, 'updated_incident', { incidentId: id, changes: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Incident updated successfully',
    data: { incident }
  });
}));

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private (owner or admin)
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Get existing incident
  const { data: existingIncident, error: fetchError } = await supabase
    .from('incidents')
    .select('user_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !existingIncident) {
    throw notFoundError('Incident not found');
  }

  // Check permissions
  const isOwner = existingIncident.user_id === userId;
  const isAdmin = ['admin'].includes(userRole);

  if (!isOwner && !isAdmin) {
    throw forbiddenError('Not authorized to delete this incident');
  }

  // Owners can only delete if status is pending
  if (isOwner && !isAdmin && existingIncident.status !== 'pending') {
    throw forbiddenError('Cannot delete incident after it has been reviewed');
  }

  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete incident:', error);
    throw new Error('Failed to delete incident');
  }

  // Clear cache
  await RedisService.del(`incident:${id}`);

  loggerHelpers.logUserAction(userId, 'deleted_incident', { incidentId: id });

  res.json({
    success: true,
    message: 'Incident deleted successfully'
  });
}));

export default router;
