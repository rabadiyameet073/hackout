import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Surface, 
  Chip,
  Button,
  Divider,
  List,
  useTheme 
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../store';
import { fetchUserProfile, fetchGamificationProfile } from '../store/slices/userSlice';
import { logoutUser } from '../store/slices/authSlice';
import { customColors, spacing } from '../utils/theme';

const ProfileScreen: React.FC = ({ navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile, gamification, isLoading } = useSelector((state: RootState) => state.user);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchUserProfile()),
        dispatch(fetchGamificationProfile()),
      ]);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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

  const getProgressToNextLevel = () => {
    if (!gamification) return 0;
    const { points } = gamification.profile;
    const { points_required, points_to_go } = gamification.profile.next_level;
    return ((points_required - points_to_go) / points_required) * 100;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <Surface style={styles.headerCard} elevation={4}>
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={user?.full_name?.charAt(0) || 'U'}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.full_name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>
                Level {user?.level} {getLevelIcon(user?.level || 1)}
              </Text>
              <Text style={styles.levelName}>
                {getLevelName(user?.level || 1)}
              </Text>
            </View>
            {user?.is_verified && (
              <Chip icon="check-circle" style={styles.verifiedChip}>
                Verified
              </Chip>
            )}
          </View>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('EditProfile')}
            icon="pencil"
            compact
          >
            Edit
          </Button>
        </View>
      </Surface>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Avatar.Icon 
              size={40} 
              icon="trophy" 
              style={{ backgroundColor: customColors.gold }}
            />
            <Text style={styles.statNumber}>{user?.points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Avatar.Icon 
              size={40} 
              icon="flag" 
              style={{ backgroundColor: customColors.success }}
            />
            <Text style={styles.statNumber}>
              {profile?.activity_summary?.total_reports || 0}
            </Text>
            <Text style={styles.statLabel}>Reports</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Avatar.Icon 
              size={40} 
              icon="check-circle" 
              style={{ backgroundColor: customColors.info }}
            />
            <Text style={styles.statNumber}>
              {profile?.activity_summary?.total_validations || 0}
            </Text>
            <Text style={styles.statLabel}>Validations</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Progress to Next Level */}
      {gamification && (
        <Card style={styles.progressCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Progress to Next Level</Text>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Level {gamification.profile.level} → Level {gamification.profile.next_level.level}
              </Text>
              <Text style={styles.progressPoints}>
                {gamification.profile.next_level.points_to_go} points to go
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${getProgressToNextLevel()}%` }
                ]}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Badges */}
      {gamification && gamification.profile.badges.length > 0 && (
        <Card style={styles.badgesCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              Badges ({gamification.profile.badges.length})
            </Text>
            <View style={styles.badgesContainer}>
              {gamification.badges
                .filter(badge => badge.earned)
                .map((badge) => (
                  <Surface key={badge.id} style={styles.badgeItem} elevation={2}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </Surface>
                ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        <Card.Content>
          <List.Item
            title="My Reports"
            description="View your incident reports"
            left={props => <List.Icon {...props} icon="flag" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('MyReports')}
          />
          <Divider />
          <List.Item
            title="Settings"
            description="App preferences and notifications"
            left={props => <List.Icon {...props} icon="cog" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <List.Item
            title="Help & Support"
            description="Get help and contact support"
            left={props => <List.Icon {...props} icon="help-circle" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Help')}
          />
          <Divider />
          <List.Item
            title="About"
            description="App version and information"
            left={props => <List.Icon {...props} icon="information" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('About')}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Card style={styles.logoutCard}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            textColor="#F44336"
          >
            Sign Out
          </Button>
        </Card.Content>
      </Card>

      {/* Member Since */}
      <View style={styles.memberSince}>
        <Text style={styles.memberSinceText}>
          Member since {new Date(user?.created_at || '').toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    margin: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    backgroundColor: customColors.mangrove,
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.sm,
  },
  levelContainer: {
    marginBottom: spacing.sm,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '500',
    color: customColors.mangrove,
  },
  levelName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  verifiedChip: {
    alignSelf: 'flex-start',
    backgroundColor: customColors.success + '20',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPoints: {
    fontSize: 12,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: customColors.mangrove,
    borderRadius: 4,
  },
  badgesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeItem: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  badgeName: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  menuCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  logoutCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
  memberSince: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  memberSinceText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
