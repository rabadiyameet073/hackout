import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { supabase } from '@/config/database';
import { RedisService } from '@/config/redis';
import { asyncHandler, validationError, authorizationError, conflictError } from '@/middleware/errorHandler';
import { authenticate, rateLimitByUser, AuthenticatedRequest } from '@/middleware/auth';
import { logger, loggerHelpers } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('full_name').isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('role').optional().isIn(['community_member', 'validator', 'researcher']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Helper function to generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerValidation, rateLimitByUser(5, 15), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError(errors.array().map(err => err.msg).join(', '));
  }

  const { email, password, username, full_name, phone, role = 'community_member' } = req.body;

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${email},username.eq.${username}`)
    .single();

  if (existingUser) {
    throw conflictError('User with this email or username already exists');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const userId = uuidv4();
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      username,
      full_name,
      phone,
      role,
      password_hash: hashedPassword,
      points: 0,
      level: 1,
      badges: [],
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id, email, username, full_name, role, points, level, is_verified')
    .single();

  if (error) {
    logger.error('User registration failed:', error);
    throw new Error('Registration failed');
  }

  // Generate verification token
  const verificationToken = generateToken(userId);
  await RedisService.set(`verification:${userId}`, verificationToken, 86400); // 24 hours

  loggerHelpers.logUserAction(userId, 'registered', { email, username, role });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email.',
    data: {
      user: newUser,
      verificationRequired: true
    }
  });
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, rateLimitByUser(10, 15), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError(errors.array().map(err => err.msg).join(', '));
  }

  const { email, password } = req.body;

  // Get user with password
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw authorizationError('Invalid credentials');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    loggerHelpers.logSecurityEvent('failed_login_attempt', { email, ip: req.ip }, 'low');
    throw authorizationError('Invalid credentials');
  }

  if (!user.is_verified) {
    throw authorizationError('Please verify your email before logging in');
  }

  // Generate token
  const token = generateToken(user.id);

  // Store session in Redis
  const sessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    loginTime: new Date().toISOString()
  };
  await RedisService.setUserSession(user.id, sessionData, 604800); // 7 days

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  loggerHelpers.logUserAction(user.id, 'logged_in', { email });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
        is_verified: user.is_verified
      }
    }
  });
}));

// @desc    Verify email
// @route   POST /api/auth/verify
// @access  Public
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw validationError('Verification token is required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Check if verification token exists in Redis
    const storedToken = await RedisService.get(`verification:${userId}`);
    if (!storedToken || storedToken !== token) {
      throw authorizationError('Invalid or expired verification token');
    }

    // Update user verification status
    const { error } = await supabase
      .from('users')
      .update({ 
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error('Verification failed');
    }

    // Remove verification token
    await RedisService.del(`verification:${userId}`);

    loggerHelpers.logUserAction(userId, 'email_verified');

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw authorizationError('Invalid or expired verification token');
    }
    throw error;
  }
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // Remove session from Redis
  await RedisService.deleteUserSession(userId);

  loggerHelpers.logUserAction(userId, 'logged_out');

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, full_name, phone, role, points, level, badges, is_verified, created_at, location')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw authorizationError('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
}));

export default router;
