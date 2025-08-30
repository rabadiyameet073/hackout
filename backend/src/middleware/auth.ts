import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '@/config/database';
import { RedisService } from '@/config/redis';
import { authorizationError, forbiddenError } from './errorHandler';
import { logger, loggerHelpers } from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    username: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw authorizationError('No token provided');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw authorizationError('No token provided');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user session exists in Redis
    const sessionData = await RedisService.getUserSession(decoded.userId);
    if (!sessionData) {
      throw authorizationError('Session expired');
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role, is_verified')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      throw authorizationError('User not found');
    }

    if (!user.is_verified) {
      throw authorizationError('Account not verified');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    };

    // Log user action
    loggerHelpers.logUserAction(user.id, 'authenticated', {
      endpoint: req.path,
      method: req.method
    });

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(authorizationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(authorizationError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(authorizationError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      loggerHelpers.logSecurityEvent('unauthorized_access_attempt', {
        userId: req.user.id,
        requiredRoles: roles,
        userRole: req.user.role,
        endpoint: req.path
      }, 'medium');
      
      next(forbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      next();
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role, is_verified')
      .eq('id', decoded.userId)
      .single();

    if (!error && user && user.is_verified) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Rate limiting middleware
export const rateLimitByUser = (maxRequests: number = 100, windowMinutes: number = 15) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.user?.id || req.ip;
      const windowSeconds = windowMinutes * 60;
      
      const { allowed, remaining } = await RedisService.checkRateLimit(
        identifier,
        maxRequests,
        windowSeconds
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowSeconds * 1000).toISOString()
      });

      if (!allowed) {
        loggerHelpers.logSecurityEvent('rate_limit_exceeded', {
          identifier,
          endpoint: req.path,
          userAgent: req.get('User-Agent')
        }, 'low');
        
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later',
            retryAfter: windowSeconds
          }
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
