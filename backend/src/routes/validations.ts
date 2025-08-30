import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '@/config/database';
import { RedisService } from '@/config/redis';
import { asyncHandler, validationError, notFoundError, forbiddenError, conflictError } from '@/middleware/errorHandler';
import { authenticate, authorize, AuthenticatedRequest } from '@/middleware/auth';
import { logger, loggerHelpers } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation rules
const createValidationRules = [
  body('incident_id').isUUID().withMessage('Valid incident ID required'),
  body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
  body('comments').optional().isLength({ max: 1000 }).withMessage('Comments too long'),
  body('evidence').optional().isArray({ max: 3 }).withMessage('Maximum 3 evidence files allowed')
];

// @desc    Create validation for an incident
// @route   POST /api/validations
// @access  Private (verified users only)
router.post('/', authenticate, createValidationRules, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError(errors.array().map(err => err.msg).join(', '));
  }

  const userId = req.user!.id;
  const { incident_id, score, comments, evidence = [] } = req.body;

  // Check if incident exists
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('id, user_id, status, validation_score')
    .eq('id', incident_id)
    .single();

  if (incidentError || !incident) {
    throw notFoundError('Incident not found');
  }

  // Users cannot validate their own incidents
  if (incident.user_id === userId) {
    throw forbiddenError('Cannot validate your own incident');
  }

  // Check if incident is in a validatable state
  if (!['pending', 'under_review'].includes(incident.status)) {
    throw forbiddenError('Incident cannot be validated in its current state');
  }

  // Check if user has already validated this incident
  const { data: existingValidation } = await supabase
    .from('validations')
    .select('id')
    .eq('incident_id', incident_id)
    .eq('validator_id', userId)
    .single();

  if (existingValidation) {
    throw conflictError('You have already validated this incident');
  }

  // Create validation
  const validationId = uuidv4();
  const validationData = {
    id: validationId,
    incident_id,
    validator_id: userId,
    validation_type: 'community',
    score,
    comments,
    evidence,
    created_at: new Date().toISOString()
  };

  const { data: validation, error } = await supabase
    .from('validations')
    .insert(validationData)
    .select(`
      *,
      users!validations_validator_id_fkey(username, full_name)
    `)
    .single();

  if (error) {
    logger.error('Failed to create validation:', error);
    throw new Error('Failed to create validation');
  }

  // Update incident validation score
  await updateIncidentValidationScore(incident_id);

  // Award points for validation
  const pointsEarned = parseInt(process.env.POINTS_PER_VALIDATION || '5');
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
      action_type: 'validate_incident',
      points_earned: pointsEarned,
      created_at: new Date().toISOString()
    });

  // Clear incident cache
  await RedisService.del(`incident:${incident_id}`);

  loggerHelpers.logValidationEvent(incident_id, userId, 'community', score);

  res.status(201).json({
    success: true,
    message: 'Validation submitted successfully',
    data: { validation }
  });
}));

// @desc    Get validations for an incident
// @route   GET /api/validations/incident/:incidentId
// @access  Public
router.get('/incident/:incidentId', asyncHandler(async (req, res) => {
  const { incidentId } = req.params;

  const { data: validations, error } = await supabase
    .from('validations')
    .select(`
      id,
      validation_type,
      score,
      comments,
      created_at,
      users!validations_validator_id_fkey(username, full_name, points, level)
    `)
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch validations:', error);
    throw new Error('Failed to fetch validations');
  }

  // Calculate validation statistics
  const stats = {
    total: validations.length,
    average_score: validations.length > 0 ? 
      validations.reduce((sum, v) => sum + v.score, 0) / validations.length : 0,
    score_distribution: {
      1: validations.filter(v => v.score === 1).length,
      2: validations.filter(v => v.score === 2).length,
      3: validations.filter(v => v.score === 3).length,
      4: validations.filter(v => v.score === 4).length,
      5: validations.filter(v => v.score === 5).length
    },
    by_type: {
      community: validations.filter(v => v.validation_type === 'community').length,
      expert: validations.filter(v => v.validation_type === 'expert').length,
      ai: validations.filter(v => v.validation_type === 'ai').length
    }
  };

  res.json({
    success: true,
    data: {
      validations,
      stats
    }
  });
}));

// @desc    Get user's validations
// @route   GET /api/validations/my
// @access  Private
router.get('/my', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const { data: validations, error, count } = await supabase
    .from('validations')
    .select(`
      *,
      incidents!validations_incident_id_fkey(
        id,
        title,
        type,
        severity,
        status,
        location
      )
    `, { count: 'exact' })
    .eq('validator_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Failed to fetch user validations:', error);
    throw new Error('Failed to fetch validations');
  }

  res.json({
    success: true,
    data: {
      validations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    }
  });
}));

// @desc    Expert validation (for validators and admins)
// @route   POST /api/validations/expert
// @access  Private (validators and admins only)
router.post('/expert', authenticate, authorize('validator', 'admin'), createValidationRules, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationError(errors.array().map(err => err.msg).join(', '));
    }

    const userId = req.user!.id;
    const { incident_id, score, comments, evidence = [] } = req.body;

    // Check if incident exists
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('id, user_id, status')
      .eq('id', incident_id)
      .single();

    if (incidentError || !incident) {
      throw notFoundError('Incident not found');
    }

    // Check if expert has already validated this incident
    const { data: existingValidation } = await supabase
      .from('validations')
      .select('id')
      .eq('incident_id', incident_id)
      .eq('validator_id', userId)
      .eq('validation_type', 'expert')
      .single();

    if (existingValidation) {
      throw conflictError('You have already provided expert validation for this incident');
    }

    // Create expert validation
    const validationId = uuidv4();
    const validationData = {
      id: validationId,
      incident_id,
      validator_id: userId,
      validation_type: 'expert',
      score,
      comments,
      evidence,
      created_at: new Date().toISOString()
    };

    const { data: validation, error } = await supabase
      .from('validations')
      .insert(validationData)
      .select(`
        *,
        users!validations_validator_id_fkey(username, full_name)
      `)
      .single();

    if (error) {
      logger.error('Failed to create expert validation:', error);
      throw new Error('Failed to create expert validation');
    }

    // Update incident validation score and potentially change status
    await updateIncidentValidationScore(incident_id);
    
    // Expert validations may trigger status changes
    if (score >= 4) {
      await supabase
        .from('incidents')
        .update({ 
          status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', incident_id);
    } else if (score <= 2) {
      await supabase
        .from('incidents')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', incident_id);
    }

    // Award points for expert validation
    const pointsEarned = parseInt(process.env.POINTS_PER_VERIFICATION || '15');
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
        action_type: 'verify_incident',
        points_earned: pointsEarned,
        created_at: new Date().toISOString()
      });

    // Clear incident cache
    await RedisService.del(`incident:${incident_id}`);

    loggerHelpers.logValidationEvent(incident_id, userId, 'expert', score);

    res.status(201).json({
      success: true,
      message: 'Expert validation submitted successfully',
      data: { validation }
    });
  })
);

// Helper function to update incident validation score
async function updateIncidentValidationScore(incidentId: string): Promise<void> {
  try {
    // Get all validations for the incident
    const { data: validations, error } = await supabase
      .from('validations')
      .select('score, validation_type')
      .eq('incident_id', incidentId);

    if (error || !validations || validations.length === 0) {
      return;
    }

    // Calculate weighted average (expert validations have higher weight)
    let totalScore = 0;
    let totalWeight = 0;

    validations.forEach(validation => {
      const weight = validation.validation_type === 'expert' ? 3 : 
                    validation.validation_type === 'ai' ? 2 : 1;
      totalScore += validation.score * weight;
      totalWeight += weight;
    });

    const validationScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Update incident
    await supabase
      .from('incidents')
      .update({ 
        validation_score: Math.round(validationScore * 100) / 100,
        status: validations.length >= 3 ? 'under_review' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId);

  } catch (error) {
    logger.error('Failed to update incident validation score:', error);
  }
}

export default router;
