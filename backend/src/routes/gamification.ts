import express from 'express';
import { supabase } from '@/config/database';
import { RedisService } from '@/config/redis';
import { asyncHandler, notFoundError } from '@/middleware/errorHandler';
import { authenticate, optionalAuth, AuthenticatedRequest } from '@/middleware/auth';
import { logger, loggerHelpers } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Badge definitions
const BADGES = {
  FIRST_REPORT: { name: 'First Reporter', description: 'Submitted your first incident report', icon: '🌱' },
  VIGILANT_GUARDIAN: { name: 'Vigilant Guardian', description: 'Reported 10 incidents', icon: '👁️' },
  MANGROVE_PROTECTOR: { name: 'Mangrove Protector', description: 'Reported 50 incidents', icon: '🛡️' },
  FOREST_CHAMPION: { name: 'Forest Champion', description: 'Reported 100 incidents', icon: '🏆' },
  COMMUNITY_VALIDATOR: { name: 'Community Validator', description: 'Validated 25 incidents', icon: '✅' },
  EXPERT_REVIEWER: { name: 'Expert Reviewer', description: 'Provided 10 expert validations', icon: '🔬' },
  STREAK_MASTER: { name: 'Streak Master', description: 'Logged in for 7 consecutive days', icon: '🔥' },
  PHOTO_JOURNALIST: { name: 'Photo Journalist', description: 'Submitted 20 reports with photos', icon: '📸' },
  LOCATION_SCOUT: { name: 'Location Scout', description: 'Reported from 10 different locations', icon: '🗺️' },
  EARLY_BIRD: { name: 'Early Bird', description: 'One of the first 100 users', icon: '🐦' }
};

// Level thresholds
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000];

// @desc    Get user's gamification profile
// @route   GET /api/gamification/profile
// @access  Private
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // Get user's current stats
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('points, level, badges, created_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw notFoundError('User not found');
  }

  // Get user's activity stats
  const [incidentStats, validationStats, gamificationHistory] = await Promise.all([
    // Incident statistics
    supabase
      .from('incidents')
      .select('id, type, created_at, status')
      .eq('user_id', userId),
    
    // Validation statistics
    supabase
      .from('validations')
      .select('id, validation_type, score, created_at')
      .eq('validator_id', userId),
    
    // Recent gamification events
    supabase
      .from('gamification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  const incidents = incidentStats.data || [];
  const validations = validationStats.data || [];
  const history = gamificationHistory.data || [];

  // Calculate additional stats
  const stats = {
    total_reports: incidents.length,
    verified_reports: incidents.filter(i => i.status === 'verified').length,
    total_validations: validations.length,
    expert_validations: validations.filter(v => v.validation_type === 'expert').length,
    average_validation_score: validations.length > 0 ? 
      validations.reduce((sum, v) => sum + v.score, 0) / validations.length : 0,
    reports_by_type: {
      illegal_cutting: incidents.filter(i => i.type === 'illegal_cutting').length,
      pollution: incidents.filter(i => i.type === 'pollution').length,
      land_reclamation: incidents.filter(i => i.type === 'land_reclamation').length,
      wildlife_disturbance: incidents.filter(i => i.type === 'wildlife_disturbance').length,
      other: incidents.filter(i => i.type === 'other').length
    },
    points_this_month: history
      .filter(h => new Date(h.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, h) => sum + h.points_earned, 0)
  };

  // Calculate next level info
  const currentLevel = user.level;
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const pointsToNextLevel = Math.max(0, nextLevelThreshold - user.points);

  // Get available badges and check which ones user has earned
  const earnedBadges = user.badges || [];
  const availableBadges = Object.entries(BADGES).map(([key, badge]) => ({
    id: key,
    ...badge,
    earned: earnedBadges.includes(key)
  }));

  res.json({
    success: true,
    data: {
      profile: {
        points: user.points,
        level: user.level,
        badges: earnedBadges,
        member_since: user.created_at,
        next_level: {
          level: currentLevel + 1,
          points_required: nextLevelThreshold,
          points_to_go: pointsToNextLevel
        }
      },
      stats,
      badges: availableBadges,
      recent_activity: history
    }
  });
}));

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
router.get('/leaderboard', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { 
    type = 'points', 
    period = 'all_time', 
    limit = 50 
  } = req.query;

  let query = supabase
    .from('users')
    .select('id, username, full_name, points, level, badges, created_at')
    .eq('is_verified', true)
    .order('points', { ascending: false })
    .limit(Number(limit));

  // For monthly leaderboard, we need to calculate points from gamification table
  if (period === 'monthly') {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyPoints, error } = await supabase
      .from('gamification')
      .select('user_id, points_earned')
      .gte('created_at', monthStart.toISOString());

    if (error) {
      logger.error('Failed to fetch monthly points:', error);
      throw new Error('Failed to fetch leaderboard');
    }

    // Aggregate monthly points by user
    const userMonthlyPoints = monthlyPoints.reduce((acc: any, entry) => {
      acc[entry.user_id] = (acc[entry.user_id] || 0) + entry.points_earned;
      return acc;
    }, {});

    // Get user details and sort by monthly points
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, full_name, points, level, badges, created_at')
      .eq('is_verified', true)
      .in('id', Object.keys(userMonthlyPoints));

    if (usersError) {
      throw new Error('Failed to fetch user details');
    }

    const leaderboard = users
      .map(user => ({
        ...user,
        monthly_points: userMonthlyPoints[user.id] || 0
      }))
      .sort((a, b) => b.monthly_points - a.monthly_points)
      .slice(0, Number(limit));

    return res.json({
      success: true,
      data: {
        leaderboard,
        period: 'monthly',
        type: 'monthly_points'
      }
    });
  }

  const { data: leaderboard, error } = await query;

  if (error) {
    logger.error('Failed to fetch leaderboard:', error);
    throw new Error('Failed to fetch leaderboard');
  }

  // Add rank to each user
  const rankedLeaderboard = leaderboard.map((user, index) => ({
    ...user,
    rank: index + 1,
    badge_count: (user.badges || []).length
  }));

  // If user is authenticated, find their position
  let userPosition = null;
  if (req.user) {
    const userIndex = rankedLeaderboard.findIndex(user => user.id === req.user!.id);
    if (userIndex !== -1) {
      userPosition = {
        rank: userIndex + 1,
        ...rankedLeaderboard[userIndex]
      };
    } else {
      // User not in top results, get their actual position
      const { data: userRank, error: rankError } = await supabase
        .rpc('get_user_rank', { user_id: req.user.id });
      
      if (!rankError && userRank) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, full_name, points, level, badges')
          .eq('id', req.user.id)
          .single();
        
        if (userData) {
          userPosition = {
            rank: userRank,
            ...userData,
            badge_count: (userData.badges || []).length
          };
        }
      }
    }
  }

  res.json({
    success: true,
    data: {
      leaderboard: rankedLeaderboard,
      user_position: userPosition,
      period,
      type
    }
  });
}));

// @desc    Check and award badges
// @route   POST /api/gamification/check-badges
// @access  Private
router.post('/check-badges', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  
  const newBadges = await checkAndAwardBadges(userId);
  
  res.json({
    success: true,
    data: {
      new_badges: newBadges,
      message: newBadges.length > 0 ? 'Congratulations! You earned new badges!' : 'No new badges earned'
    }
  });
}));

// Helper function to check and award badges
async function checkAndAwardBadges(userId: string): Promise<string[]> {
  try {
    // Get user's current data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('badges, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) return [];

    const currentBadges = user.badges || [];
    const newBadges: string[] = [];

    // Get user's activity stats
    const [incidents, validations, userCount] = await Promise.all([
      supabase.from('incidents').select('id, type, images').eq('user_id', userId),
      supabase.from('validations').select('id, validation_type').eq('validator_id', userId),
      supabase.from('users').select('id', { count: 'exact' })
    ]);

    const incidentCount = incidents.data?.length || 0;
    const validationCount = validations.data?.length || 0;
    const expertValidationCount = validations.data?.filter(v => v.validation_type === 'expert').length || 0;
    const reportsWithPhotos = incidents.data?.filter(i => i.images && i.images.length > 0).length || 0;
    const totalUsers = userCount.count || 0;

    // Check badge conditions
    const badgeChecks = [
      { badge: 'FIRST_REPORT', condition: incidentCount >= 1 },
      { badge: 'VIGILANT_GUARDIAN', condition: incidentCount >= 10 },
      { badge: 'MANGROVE_PROTECTOR', condition: incidentCount >= 50 },
      { badge: 'FOREST_CHAMPION', condition: incidentCount >= 100 },
      { badge: 'COMMUNITY_VALIDATOR', condition: validationCount >= 25 },
      { badge: 'EXPERT_REVIEWER', condition: expertValidationCount >= 10 },
      { badge: 'PHOTO_JOURNALIST', condition: reportsWithPhotos >= 20 },
      { badge: 'EARLY_BIRD', condition: totalUsers <= 100 }
    ];

    for (const check of badgeChecks) {
      if (check.condition && !currentBadges.includes(check.badge)) {
        newBadges.push(check.badge);
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      const updatedBadges = [...currentBadges, ...newBadges];
      
      await supabase
        .from('users')
        .update({ 
          badges: updatedBadges,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Log badge awards
      for (const badge of newBadges) {
        await supabase
          .from('gamification')
          .insert({
            id: uuidv4(),
            user_id: userId,
            action_type: 'badge_earned',
            points_earned: 0,
            badge_earned: badge,
            created_at: new Date().toISOString()
          });

        loggerHelpers.logUserAction(userId, 'badge_earned', { badge });
      }
    }

    return newBadges;
  } catch (error) {
    logger.error('Failed to check badges:', error);
    return [];
  }
}

export default router;
