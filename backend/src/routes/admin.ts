import express from 'express';
import { body, query, validationResult } from 'express-validator';

import { authenticateToken, requireRole } from '@/middleware/auth';
import { supabase } from '@/config/supabase';
import { logger } from '@/utils/logger';

const router = express.Router();

// Middleware to ensure admin access
const requireAdmin = requireRole(['admin', 'moderator', 'analyst']);

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get incident statistics
    const { data: incidentStats } = await supabase
      .from('incidents')
      .select('status, severity, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get user statistics
    const { data: userStats } = await supabase
      .from('users')
      .select('created_at, is_active')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get validation statistics
    const { data: validationStats } = await supabase
      .from('validations')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate statistics
    const stats = {
      incidents: {
        total: incidentStats?.length || 0,
        pending: incidentStats?.filter(i => i.status === 'pending').length || 0,
        verified: incidentStats?.filter(i => i.status === 'verified').length || 0,
        resolved: incidentStats?.filter(i => i.status === 'resolved').length || 0,
        byseverity: {
          low: incidentStats?.filter(i => i.severity === 'low').length || 0,
          medium: incidentStats?.filter(i => i.severity === 'medium').length || 0,
          high: incidentStats?.filter(i => i.severity === 'high').length || 0,
          critical: incidentStats?.filter(i => i.severity === 'critical').length || 0,
        }
      },
      users: {
        total: userStats?.length || 0,
        active: userStats?.filter(u => u.is_active).length || 0,
        newThisMonth: userStats?.length || 0,
      },
      validations: {
        pending: validationStats?.filter(v => v.status === 'pending').length || 0,
        completed: validationStats?.filter(v => v.status === 'completed').length || 0,
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /api/admin/dashboard/recent-activity
 * Get recent system activity
 */
router.get('/dashboard/recent-activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get recent incidents
    const { data: recentIncidents } = await supabase
      .from('incidents')
      .select(`
        id,
        title,
        severity,
        created_at,
        users!incidents_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent validations
    const { data: recentValidations } = await supabase
      .from('validations')
      .select(`
        id,
        status,
        created_at,
        incidents!validations_incident_id_fkey(title)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Combine and format activities
    const activities = [
      ...(recentIncidents?.map(incident => ({
        id: incident.id,
        type: 'incident',
        title: `New incident: ${incident.title}`,
        description: `Reported by ${incident.users?.full_name}`,
        severity: incident.severity,
        timestamp: incident.created_at
      })) || []),
      ...(recentValidations?.map(validation => ({
        id: validation.id,
        type: 'validation',
        title: `Validation ${validation.status}`,
        description: `For incident: ${validation.incidents?.title}`,
        severity: 'info',
        timestamp: validation.created_at
      })) || [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 15);

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    logger.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

/**
 * GET /api/admin/incidents
 * Get incidents with filtering and pagination
 */
router.get('/incidents', 
  authenticateToken, 
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'under_review', 'verified', 'rejected', 'resolved']),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('search').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('incidents')
        .select(`
          *,
          users!incidents_user_id_fkey(full_name, email),
          validations(validation_score, ai_confidence)
        `, { count: 'exact' });

      // Apply filters
      if (req.query.status) {
        query = query.eq('status', req.query.status);
      }
      if (req.query.severity) {
        query = query.eq('severity', req.query.severity);
      }
      if (req.query.search) {
        query = query.or(`title.ilike.%${req.query.search}%,description.ilike.%${req.query.search}%`);
      }

      const { data: incidents, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        incidents,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });

    } catch (error) {
      logger.error('Admin incidents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incidents'
      });
    }
  }
);

/**
 * PUT /api/admin/incidents/:id
 * Update incident status or details
 */
router.put('/incidents/:id',
  authenticateToken,
  requireAdmin,
  [
    body('status').optional().isIn(['pending', 'under_review', 'verified', 'rejected', 'resolved']),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('admin_notes').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id
      };

      const { data: incident, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the admin action
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: req.user?.id,
          action: 'update_incident',
          resource_type: 'incident',
          resource_id: id,
          details: updateData
        });

      res.json({
        success: true,
        incident
      });

    } catch (error) {
      logger.error('Update incident error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update incident'
      });
    }
  }
);

/**
 * GET /api/admin/users
 * Get users with filtering and pagination
 */
router.get('/users',
  authenticateToken,
  requireRole(['admin', 'moderator']),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['user', 'validator', 'expert', 'moderator', 'admin']),
    query('status').optional().isIn(['active', 'suspended', 'pending']),
    query('search').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          is_active,
          created_at,
          last_login,
          profile_data
        `, { count: 'exact' });

      // Apply filters
      if (req.query.role) {
        query = query.eq('role', req.query.role);
      }
      if (req.query.status === 'active') {
        query = query.eq('is_active', true);
      } else if (req.query.status === 'suspended') {
        query = query.eq('is_active', false);
      }
      if (req.query.search) {
        query = query.or(`full_name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%`);
      }

      const { data: users, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });

    } catch (error) {
      logger.error('Admin users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/suspend
 * Suspend a user account
 */
router.post('/users/:id/suspend',
  authenticateToken,
  requireRole(['admin', 'moderator']),
  [
    body('reason').notEmpty().withMessage('Suspension reason is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const { data: user, error } = await supabase
        .from('users')
        .update({
          is_active: false,
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the admin action
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: req.user?.id,
          action: 'suspend_user',
          resource_type: 'user',
          resource_id: id,
          details: { reason }
        });

      res.json({
        success: true,
        message: 'User suspended successfully',
        user
      });

    } catch (error) {
      logger.error('Suspend user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend user'
      });
    }
  }
);

export default router;
