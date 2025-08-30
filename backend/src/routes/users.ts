import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '@/config/database';
import { asyncHandler, validationError, notFoundError, forbiddenError } from '@/middleware/errorHandler';
import { authenticate, authorize, AuthenticatedRequest } from '@/middleware/auth';
import { logger, loggerHelpers } from '@/utils/logger';

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('full_name').optional().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('location.address').optional().isLength({ max: 500 }).withMessage('Address too long')
];

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, full_name, phone, location, role, points, level, badges, is_verified, created_at, last_login')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw notFoundError('User not found');
  }

  // Get user's activity summary
  const [incidentCount, validationCount] = await Promise.all([
    supabase.from('incidents').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('validations').select('id', { count: 'exact' }).eq('validator_id', userId)
  ]);

  const profile = {
    ...user,
    activity_summary: {
      total_reports: incidentCount.count || 0,
      total_validations: validationCount.count || 0
    }
  };

  res.json({
    success: true,
    data: { user: profile }
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', authenticate, updateProfileValidation, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError(errors.array().map(err => err.msg).join(', '));
  }

  const userId = req.user!.id;
  const { full_name, phone, location } = req.body;

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (full_name !== undefined) updateData.full_name = full_name;
  if (phone !== undefined) updateData.phone = phone;
  if (location !== undefined) updateData.location = location;

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, email, username, full_name, phone, location, role, points, level, badges, is_verified')
    .single();

  if (error) {
    logger.error('Failed to update user profile:', error);
    throw new Error('Failed to update profile');
  }

  loggerHelpers.logUserAction(userId, 'profile_updated', { fields: Object.keys(updateData) });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// @desc    Get user by ID (public profile)
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, full_name, role, points, level, badges, created_at')
    .eq('id', id)
    .eq('is_verified', true)
    .single();

  if (error || !user) {
    throw notFoundError('User not found');
  }

  // Get user's public activity stats
  const [incidentStats, validationStats] = await Promise.all([
    supabase
      .from('incidents')
      .select('id, type, status, created_at')
      .eq('user_id', id),
    supabase
      .from('validations')
      .select('id, validation_type, created_at')
      .eq('validator_id', id)
  ]);

  const incidents = incidentStats.data || [];
  const validations = validationStats.data || [];

  const publicProfile = {
    ...user,
    stats: {
      total_reports: incidents.length,
      verified_reports: incidents.filter(i => i.status === 'verified').length,
      total_validations: validations.length,
      expert_validations: validations.filter(v => v.validation_type === 'expert').length,
      member_since: user.created_at,
      reports_by_type: {
        illegal_cutting: incidents.filter(i => i.type === 'illegal_cutting').length,
        pollution: incidents.filter(i => i.type === 'pollution').length,
        land_reclamation: incidents.filter(i => i.type === 'land_reclamation').length,
        wildlife_disturbance: incidents.filter(i => i.type === 'wildlife_disturbance').length,
        other: incidents.filter(i => i.type === 'other').length
      }
    }
  };

  res.json({
    success: true,
    data: { user: publicProfile }
  });
}));

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (admin only)
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { 
    page = 1, 
    limit = 20, 
    role, 
    is_verified, 
    search,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('users')
    .select(`
      id, 
      email, 
      username, 
      full_name, 
      phone, 
      role, 
      points, 
      level, 
      badges, 
      is_verified, 
      created_at, 
      last_login
    `, { count: 'exact' });

  // Apply filters
  if (role) query = query.eq('role', role);
  if (is_verified !== undefined) query = query.eq('is_verified', is_verified === 'true');
  if (search) {
    query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'last_login', 'points', 'level', 'username', 'email'];
  const sortField = validSortFields.includes(sort as string) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? true : false;
  
  query = query.order(sortField as string, { ascending: sortOrder });

  // Pagination
  query = query.range(offset, offset + Number(limit) - 1);

  const { data: users, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch users:', error);
    throw new Error('Failed to fetch users');
  }

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    }
  });
}));

// @desc    Update user role (admin only)
// @route   PUT /api/users/:id/role
// @access  Private (admin only)
router.put('/:id/role', authenticate, authorize('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['community_member', 'validator', 'admin', 'researcher'].includes(role)) {
    throw validationError('Invalid role');
  }

  // Prevent self-demotion from admin
  if (id === req.user!.id && role !== 'admin') {
    throw forbiddenError('Cannot change your own admin role');
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({ 
      role,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, username, email, role')
    .single();

  if (error) {
    logger.error('Failed to update user role:', error);
    throw new Error('Failed to update user role');
  }

  loggerHelpers.logUserAction(req.user!.id, 'role_updated', { 
    targetUserId: id, 
    newRole: role,
    targetUsername: user.username 
  });

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  });
}));

// @desc    Verify/unverify user (admin only)
// @route   PUT /api/users/:id/verify
// @access  Private (admin only)
router.put('/:id/verify', authenticate, authorize('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;

  if (typeof is_verified !== 'boolean') {
    throw validationError('is_verified must be a boolean');
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({ 
      is_verified,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, username, email, is_verified')
    .single();

  if (error) {
    logger.error('Failed to update user verification:', error);
    throw new Error('Failed to update user verification');
  }

  loggerHelpers.logUserAction(req.user!.id, 'verification_updated', { 
    targetUserId: id, 
    isVerified: is_verified,
    targetUsername: user.username 
  });

  res.json({
    success: true,
    message: `User ${is_verified ? 'verified' : 'unverified'} successfully`,
    data: { user }
  });
}));

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (admin only)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user!.id) {
    throw forbiddenError('Cannot delete your own account');
  }

  // Get user info before deletion
  const { data: userToDelete, error: fetchError } = await supabase
    .from('users')
    .select('username, email')
    .eq('id', id)
    .single();

  if (fetchError || !userToDelete) {
    throw notFoundError('User not found');
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete user:', error);
    throw new Error('Failed to delete user');
  }

  loggerHelpers.logUserAction(req.user!.id, 'user_deleted', { 
    deletedUserId: id,
    deletedUsername: userToDelete.username,
    deletedEmail: userToDelete.email
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats
// @access  Private (admin only)
router.get('/admin/stats', authenticate, authorize('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const [
    totalUsers,
    verifiedUsers,
    usersByRole,
    recentUsers,
    activeUsers
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact' }),
    supabase.from('users').select('id', { count: 'exact' }).eq('is_verified', true),
    supabase.from('users').select('role'),
    supabase.from('users').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('users').select('id', { count: 'exact' }).gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  const roleDistribution = (usersByRole.data || []).reduce((acc: any, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    total_users: totalUsers.count || 0,
    verified_users: verifiedUsers.count || 0,
    unverified_users: (totalUsers.count || 0) - (verifiedUsers.count || 0),
    new_users_this_week: recentUsers.count || 0,
    active_users_this_month: activeUsers.count || 0,
    role_distribution: roleDistribution
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

export default router;
