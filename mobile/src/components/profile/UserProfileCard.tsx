import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Button, 
  Chip, 
  Surface,
  ProgressBar,
  IconButton,
  useTheme 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string;
  level: number;
  points: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    earned_at: string;
  }>;
  stats: {
    total_reports: number;
    verified_reports: number;
    validations_given: number;
    community_score: number;
  };
  achievements: {
    streak_days: number;
    areas_protected: number;
    impact_score: number;
  };
  location?: {
    city: string;
    country: string;
  };
  joined_date: string;
  is_verified: boolean;
  is_expert: boolean;
  bio?: string;
}

interface UserProfileCardProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  onFollowUser?: () => void;
  onMessageUser?: () => void;
  onViewBadges?: () => void;
  onViewReports?: () => void;
  compact?: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  isOwnProfile = false,
  onEditProfile,
  onFollowUser,
  onMessageUser,
  onViewBadges,
  onViewReports,
  compact = false,
}) => {
  const theme = useTheme();
  const [isFollowing, setIsFollowing] = useState(false);

  const scale = useSharedValue(1);
  const badgeScale = useSharedValue(0);

  React.useEffect(() => {
    badgeScale.value = withSpring(1, { damping: 15 });
  }, []);

  const getLevelIcon = (level: number) => {
    if (level >= 10) return '👑';
    if (level >= 8) return '🦸';
    if (level >= 6) return '🏞️';
    if (level >= 4) return '🌲';
    if (level >= 2) return '🌿';
    return '🌱';
  };

  const getLevelName = (level: number) => {
    const levels = [
      'Seedling', 'Sprout', 'Sapling', 'Young Tree', 'Mature Tree',
      'Forest Guardian', 'Ecosystem Protector', 'Conservation Hero',
      'Environmental Champion', 'Mangrove Legend'
    ];
    return levels[Math.min(level - 1, levels.length - 1)] || 'Seedling';
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return customColors.gold;
    if (level >= 8) return customColors.platinum;
    if (level >= 6) return customColors.silver;
    if (level >= 4) return customColors.bronze;
    return customColors.mangrove;
  };

  const handleFollowPress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    setIsFollowing(!isFollowing);
    onFollowUser?.();
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  if (compact) {
    return (
      <Card style={styles.compactCard}>
        <Card.Content style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Avatar.Image
              size={40}
              source={profile.avatar_url ? { uri: profile.avatar_url } : undefined}
              style={styles.compactAvatar}
            />
            <View style={styles.compactInfo}>
              <Text style={styles.compactName}>{profile.full_name}</Text>
              <Text style={styles.compactLevel}>
                Level {profile.level} {getLevelIcon(profile.level)}
              </Text>
            </View>
            <View style={styles.compactStats}>
              <Text style={styles.compactStatNumber}>{profile.points}</Text>
              <Text style={styles.compactStatLabel}>Points</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.profileCard}>
      <LinearGradient
        colors={[getLevelColor(profile.level) + '20', getLevelColor(profile.level) + '10', '#FFFFFF']}
        style={styles.gradient}
      >
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={80}
                source={profile.avatar_url ? { uri: profile.avatar_url } : undefined}
                style={styles.avatar}
              />
              {profile.is_verified && (
                <Surface style={styles.verifiedBadge} elevation={2}>
                  <Ionicons name="checkmark-circle" size={20} color={customColors.success} />
                </Surface>
              )}
              {profile.is_expert && (
                <Surface style={styles.expertBadge} elevation={2}>
                  <Ionicons name="school" size={16} color={customColors.gold} />
                </Surface>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile.full_name}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              
              <View style={styles.levelContainer}>
                <Text style={[styles.levelText, { color: getLevelColor(profile.level) }]}>
                  Level {profile.level} {getLevelIcon(profile.level)}
                </Text>
                <Text style={styles.levelName}>{getLevelName(profile.level)}</Text>
              </View>

              {profile.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={14} color="#666" />
                  <Text style={styles.location}>
                    {profile.location.city}, {profile.location.country}
                  </Text>
                </View>
              )}
            </View>

            {!isOwnProfile && (
              <View style={styles.actionButtons}>
                <Animated.View style={animatedButtonStyle}>
                  <Button
                    mode={isFollowing ? "outlined" : "contained"}
                    onPress={handleFollowPress}
                    icon={isFollowing ? "account-check" : "account-plus"}
                    compact
                    style={styles.followButton}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                </Animated.View>
                <IconButton
                  icon="message"
                  onPress={onMessageUser}
                  style={styles.messageButton}
                />
              </View>
            )}

            {isOwnProfile && (
              <IconButton
                icon="pencil"
                onPress={onEditProfile}
                style={styles.editButton}
              />
            )}
          </View>

          {/* Bio */}
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Surface style={styles.statCard} elevation={1}>
              <Text style={styles.statNumber}>{profile.stats.total_reports}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </Surface>
            <Surface style={styles.statCard} elevation={1}>
              <Text style={styles.statNumber}>{profile.stats.verified_reports}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </Surface>
            <Surface style={styles.statCard} elevation={1}>
              <Text style={styles.statNumber}>{profile.stats.validations_given}</Text>
              <Text style={styles.statLabel}>Validations</Text>
            </Surface>
            <Surface style={styles.statCard} elevation={1}>
              <Text style={styles.statNumber}>{profile.badges.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </Surface>
          </View>

          {/* Achievements */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Achievements</Text>
            <View style={styles.achievementsList}>
              <View style={styles.achievementItem}>
                <Ionicons name="flame" size={20} color={customColors.warning} />
                <Text style={styles.achievementText}>
                  {profile.achievements.streak_days} day streak
                </Text>
              </View>
              <View style={styles.achievementItem}>
                <Ionicons name="leaf" size={20} color={customColors.success} />
                <Text style={styles.achievementText}>
                  {profile.achievements.areas_protected} areas protected
                </Text>
              </View>
              <View style={styles.achievementItem}>
                <Ionicons name="trending-up" size={20} color={customColors.info} />
                <Text style={styles.achievementText}>
                  {profile.achievements.impact_score} impact score
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Badges */}
          {profile.badges.length > 0 && (
            <View style={styles.badgesSection}>
              <View style={styles.badgesHeader}>
                <Text style={styles.sectionTitle}>🏅 Recent Badges</Text>
                <Button
                  mode="text"
                  onPress={onViewBadges}
                  compact
                >
                  View All
                </Button>
              </View>
              <Animated.View style={[styles.badgesList, animatedBadgeStyle]}>
                {profile.badges.slice(0, 4).map((badge, index) => (
                  <Surface key={badge.id} style={styles.badgeItem} elevation={2}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </Surface>
                ))}
                {profile.badges.length > 4 && (
                  <Surface style={styles.moreBadges} elevation={1}>
                    <Text style={styles.moreBadgesText}>+{profile.badges.length - 4}</Text>
                  </Surface>
                )}
              </Animated.View>
            </View>
          )}

          {/* Community Score */}
          <View style={styles.communitySection}>
            <Text style={styles.sectionTitle}>🤝 Community Score</Text>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreNumber}>{profile.stats.community_score}/100</Text>
                <Text style={styles.scoreLabel}>Reputation</Text>
              </View>
              <View style={styles.scoreBar}>
                <ProgressBar
                  progress={profile.stats.community_score / 100}
                  color={
                    profile.stats.community_score >= 80 ? customColors.success :
                    profile.stats.community_score >= 60 ? customColors.warning :
                    customColors.severityHigh
                  }
                  style={styles.progressBar}
                />
              </View>
            </View>
          </View>

          {/* Member Since */}
          <View style={styles.memberSince}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.memberSinceText}>
              Member since {new Date(profile.joined_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.bottomActions}>
            <Button
              mode="outlined"
              onPress={onViewReports}
              icon="flag"
              style={styles.bottomButton}
            >
              View Reports
            </Button>
            {isOwnProfile && (
              <Button
                mode="contained"
                onPress={onEditProfile}
                icon="pencil"
                style={styles.bottomButton}
              >
                Edit Profile
              </Button>
            )}
          </View>
        </Card.Content>
      </LinearGradient>
    </Card>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    margin: spacing.md,
    overflow: 'hidden',
  },
  compactCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  gradient: {
    borderRadius: 12,
  },
  content: {
    paddingVertical: spacing.lg,
  },
  compactContent: {
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    backgroundColor: customColors.mangrove,
  },
  compactAvatar: {
    marginRight: spacing.md,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  expertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  compactInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  compactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.sm,
  },
  levelContainer: {
    marginBottom: spacing.sm,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactLevel: {
    fontSize: 12,
    color: '#666',
  },
  levelName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginLeft: spacing.xs,
  },
  actionButtons: {
    alignItems: 'center',
  },
  followButton: {
    marginBottom: spacing.sm,
  },
  messageButton: {
    margin: 0,
  },
  editButton: {
    margin: 0,
  },
  compactStats: {
    alignItems: 'center',
  },
  compactStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  compactStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.xs,
  },
  achievementsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  achievementsList: {
    gap: spacing.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  achievementText: {
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  badgesSection: {
    marginBottom: spacing.lg,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgesList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badgeItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  badgeName: {
    fontSize: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  moreBadges: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  moreBadgesText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  communitySection: {
    marginBottom: spacing.lg,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreInfo: {
    marginRight: spacing.md,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  scoreBar: {
    flex: 1,
  },
  progressBar: {
    height: 8,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  memberSinceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: spacing.xs,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomButton: {
    flex: 1,
  },
});

export default UserProfileCard;
