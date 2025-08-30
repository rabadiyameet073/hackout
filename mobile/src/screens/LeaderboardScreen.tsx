import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Surface, 
  Chip,
  Button,
  SegmentedButtons,
  useTheme 
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../store';
import { fetchLeaderboard, fetchGamificationProfile } from '../store/slices/userSlice';
import { customColors, spacing } from '../utils/theme';

const LeaderboardScreen: React.FC = ({ navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { leaderboard, userPosition, isLoading, gamification } = useSelector((state: RootState) => state.user);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('all_time');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchLeaderboard({ period, limit: 50 })),
        dispatch(fetchGamificationProfile()),
      ]);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return customColors.gold;
      case 2: return customColors.silver;
      case 3: return customColors.bronze;
      default: return theme.colors.surfaceVariant;
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.headerTitle}>🏆 Conservation Champions</Text>
        <Text style={styles.headerSubtitle}>
          Top contributors protecting our mangroves
        </Text>
      </Surface>

      {/* Period Selector */}
      <Card style={styles.periodCard}>
        <Card.Content>
          <SegmentedButtons
            value={period}
            onValueChange={setPeriod}
            buttons={[
              {
                value: 'all_time',
                label: 'All Time',
                icon: 'trophy',
              },
              {
                value: 'monthly',
                label: 'This Month',
                icon: 'calendar',
              },
            ]}
          />
        </Card.Content>
      </Card>

      {/* User Position */}
      {userPosition && (
        <Card style={styles.userPositionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Your Position</Text>
            <Surface style={styles.userPositionItem} elevation={1}>
              <View style={styles.rankContainer}>
                <Avatar.Text 
                  size={40} 
                  label={getRankIcon(userPosition.rank)}
                  style={[styles.rankAvatar, { backgroundColor: getRankColor(userPosition.rank) }]}
                />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userPosition.full_name}</Text>
                <Text style={styles.userStats}>
                  {userPosition.points} points • Level {userPosition.level} {getLevelIcon(userPosition.level)}
                </Text>
                <View style={styles.badgeContainer}>
                  <Chip icon="medal" style={styles.badgeChip}>
                    {userPosition.badge_count} badges
                  </Chip>
                </View>
              </View>
            </Surface>
          </Card.Content>
        </Card>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <Card style={styles.podiumCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Top 3 Champions</Text>
            <View style={styles.podium}>
              {/* Second Place */}
              <View style={[styles.podiumPosition, styles.secondPlace]}>
                <Avatar.Text 
                  size={50} 
                  label="🥈"
                  style={styles.podiumAvatar}
                />
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[1]?.full_name}
                </Text>
                <Text style={styles.podiumPoints}>
                  {leaderboard[1]?.points} pts
                </Text>
              </View>

              {/* First Place */}
              <View style={[styles.podiumPosition, styles.firstPlace]}>
                <Avatar.Text 
                  size={60} 
                  label="🥇"
                  style={styles.podiumAvatar}
                />
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[0]?.full_name}
                </Text>
                <Text style={styles.podiumPoints}>
                  {leaderboard[0]?.points} pts
                </Text>
                <Ionicons name="crown" size={20} color={customColors.gold} />
              </View>

              {/* Third Place */}
              <View style={[styles.podiumPosition, styles.thirdPlace]}>
                <Avatar.Text 
                  size={50} 
                  label="🥉"
                  style={styles.podiumAvatar}
                />
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[2]?.full_name}
                </Text>
                <Text style={styles.podiumPoints}>
                  {leaderboard[2]?.points} pts
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card style={styles.leaderboardCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Full Rankings</Text>
          {leaderboard.map((entry, index) => (
            <Surface 
              key={entry.id} 
              style={[
                styles.leaderboardItem,
                entry.id === user?.id && styles.currentUserItem
              ]} 
              elevation={entry.id === user?.id ? 2 : 1}
            >
              <View style={styles.rankContainer}>
                <Avatar.Text 
                  size={40} 
                  label={getRankIcon(entry.rank)}
                  style={[styles.rankAvatar, { backgroundColor: getRankColor(entry.rank) }]}
                />
              </View>
              
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{entry.full_name}</Text>
                  {entry.id === user?.id && (
                    <Chip style={styles.youChip} textStyle={styles.youChipText}>
                      You
                    </Chip>
                  )}
                </View>
                <Text style={styles.userStats}>
                  {period === 'monthly' ? entry.monthly_points : entry.points} points • 
                  Level {entry.level} {getLevelIcon(entry.level)}
                </Text>
                <View style={styles.badgeContainer}>
                  <Chip icon="medal" style={styles.badgeChip}>
                    {entry.badge_count} badges
                  </Chip>
                </View>
              </View>

              <Button
                mode="text"
                onPress={() => navigation.navigate('PublicProfile', { userId: entry.id })}
                compact
              >
                View
              </Button>
            </Surface>
          ))}

          {leaderboard.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No rankings available yet</Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate('Report')}
                style={styles.emptyAction}
              >
                Start Contributing
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* My Progress */}
      {gamification && (
        <Card style={styles.progressCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>My Progress</Text>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressNumber}>{gamification.stats.total_reports}</Text>
                <Text style={styles.progressLabel}>Reports</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressNumber}>{gamification.stats.total_validations}</Text>
                <Text style={styles.progressLabel}>Validations</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressNumber}>{gamification.profile.badges.length}</Text>
                <Text style={styles.progressLabel}>Badges</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressNumber}>{gamification.profile.level}</Text>
                <Text style={styles.progressLabel}>Level</Text>
              </View>
            </View>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Profile')}
              icon="account"
              style={styles.viewProfileButton}
            >
              View Full Profile
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.mangrove,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  periodCard: {
    margin: spacing.md,
  },
  userPositionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: customColors.mangrove + '10',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  userPositionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
  },
  podiumCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 150,
  },
  podiumPosition: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  firstPlace: {
    height: 120,
    justifyContent: 'flex-end',
  },
  secondPlace: {
    height: 100,
    justifyContent: 'flex-end',
  },
  thirdPlace: {
    height: 80,
    justifyContent: 'flex-end',
  },
  podiumAvatar: {
    marginBottom: spacing.xs,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  leaderboardCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  currentUserItem: {
    backgroundColor: customColors.mangrove + '10',
    borderWidth: 1,
    borderColor: customColors.mangrove + '30',
  },
  rankContainer: {
    marginRight: spacing.md,
  },
  rankAvatar: {
    backgroundColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  youChip: {
    height: 24,
    backgroundColor: customColors.mangrove,
  },
  youChipText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  userStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badgeChip: {
    height: 24,
    backgroundColor: customColors.gold + '20',
  },
  progressCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.xs,
  },
  viewProfileButton: {
    borderColor: customColors.mangrove,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: spacing.md,
  },
  emptyAction: {
    marginTop: spacing.sm,
  },
});

export default LeaderboardScreen;
