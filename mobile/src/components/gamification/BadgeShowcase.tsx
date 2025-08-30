import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Surface, 
  Button,
  Modal,
  Portal,
  IconButton,
  Chip,
  useTheme 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withDelay 
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  category: 'reporting' | 'validation' | 'engagement' | 'achievement';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: string;
  progress?: {
    current: number;
    total: number;
  };
}

interface BadgeShowcaseProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
}

const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ badges, onBadgePress }) => {
  const theme = useTheme();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const scale = useSharedValue(1);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return theme.colors.primary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reporting': return '📝';
      case 'validation': return '✅';
      case 'engagement': return '🤝';
      case 'achievement': return '🏆';
      default: return '🏅';
    }
  };

  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
    onBadgePress?.(badge);

    // Animate badge press
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const renderBadge = (badge: Badge, index: number) => (
    <Animated.View
      key={badge.id}
      style={[
        animatedStyle,
        {
          transform: [
            {
              scale: withDelay(
                index * 100,
                withSpring(badge.earned ? 1 : 0.9)
              ),
            },
          ],
        },
      ]}
    >
      <Surface
        style={[
          styles.badgeContainer,
          {
            borderColor: getRarityColor(badge.rarity),
            borderWidth: badge.earned ? 2 : 1,
            opacity: badge.earned ? 1 : 0.6,
          },
        ]}
        elevation={badge.earned ? 4 : 1}
      >
        <Card
          style={[
            styles.badgeCard,
            !badge.earned && styles.unearned,
          ]}
          onPress={() => handleBadgePress(badge)}
        >
          <LinearGradient
            colors={
              badge.earned
                ? [getRarityColor(badge.rarity) + '20', getRarityColor(badge.rarity) + '10']
                : ['#F5F5F5', '#E0E0E0']
            }
            style={styles.badgeGradient}
          >
            <View style={styles.badgeContent}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={[styles.badgeName, !badge.earned && styles.unearnedText]}>
                {badge.name}
              </Text>
              
              {badge.earned && badge.earnedAt && (
                <Text style={styles.earnedDate}>
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </Text>
              )}

              {!badge.earned && badge.progress && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    {badge.progress.current}/{badge.progress.total}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(badge.progress.current / badge.progress.total) * 100}%`,
                          backgroundColor: getRarityColor(badge.rarity),
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              <Chip
                style={[
                  styles.rarityChip,
                  { backgroundColor: getRarityColor(badge.rarity) },
                ]}
                textStyle={{ color: '#FFFFFF', fontSize: 10 }}
              >
                {badge.rarity.toUpperCase()}
              </Chip>
            </View>
          </LinearGradient>
        </Card>
      </Surface>
    </Animated.View>
  );

  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{earnedBadges.length}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{badges.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.round((earnedBadges.length / badges.length) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Earned Badges</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesList}
          >
            {earnedBadges.map((badge, index) => renderBadge(badge, index))}
          </ScrollView>
        </View>
      )}

      {/* Available Badges */}
      {unearnedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Available Badges</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesList}
          >
            {unearnedBadges.map((badge, index) => renderBadge(badge, index))}
          </ScrollView>
        </View>
      )}

      {/* Badge Detail Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedBadge && (
            <Card style={styles.modalCard}>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalBadgeIcon}>{selectedBadge.icon}</Text>
                  <IconButton
                    icon="close"
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  />
                </View>

                <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>
                <Text style={styles.modalBadgeDescription}>
                  {selectedBadge.description}
                </Text>

                <View style={styles.modalChips}>
                  <Chip
                    icon={() => <Text>{getCategoryIcon(selectedBadge.category)}</Text>}
                    style={styles.categoryChip}
                  >
                    {selectedBadge.category}
                  </Chip>
                  <Chip
                    style={[
                      styles.rarityChip,
                      { backgroundColor: getRarityColor(selectedBadge.rarity) },
                    ]}
                    textStyle={{ color: '#FFFFFF' }}
                  >
                    {selectedBadge.rarity}
                  </Chip>
                </View>

                <View style={styles.requirementsSection}>
                  <Text style={styles.requirementsTitle}>Requirements:</Text>
                  <Text style={styles.requirementsText}>
                    {selectedBadge.requirements}
                  </Text>
                </View>

                {selectedBadge.earned && selectedBadge.earnedAt && (
                  <View style={styles.earnedSection}>
                    <Text style={styles.earnedTitle}>Earned on:</Text>
                    <Text style={styles.earnedDateModal}>
                      {new Date(selectedBadge.earnedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {!selectedBadge.earned && selectedBadge.progress && (
                  <View style={styles.progressSection}>
                    <Text style={styles.progressTitle}>Progress:</Text>
                    <View style={styles.modalProgressBar}>
                      <View
                        style={[
                          styles.modalProgressFill,
                          {
                            width: `${(selectedBadge.progress.current / selectedBadge.progress.total) * 100}%`,
                            backgroundColor: getRarityColor(selectedBadge.rarity),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.modalProgressText}>
                      {selectedBadge.progress.current} / {selectedBadge.progress.total}
                    </Text>
                  </View>
                )}

                <Button
                  mode="contained"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                >
                  Close
                </Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    margin: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  badgesList: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  badgeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeCard: {
    width: 120,
    height: 140,
  },
  unearned: {
    opacity: 0.7,
  },
  badgeGradient: {
    flex: 1,
    padding: spacing.sm,
  },
  badgeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  unearnedText: {
    color: '#999',
  },
  earnedDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: spacing.xs,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  rarityChip: {
    height: 20,
  },
  modalContainer: {
    margin: spacing.lg,
  },
  modalCard: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalBadgeIcon: {
    fontSize: 48,
  },
  closeButton: {
    margin: 0,
  },
  modalBadgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalBadgeDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: spacing.lg,
  },
  modalChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    backgroundColor: customColors.mangrove + '20',
  },
  requirementsSection: {
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  requirementsText: {
    fontSize: 14,
    color: '#666',
  },
  earnedSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  earnedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  earnedDateModal: {
    fontSize: 14,
    color: customColors.success,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButton: {
    marginTop: spacing.md,
  },
});

export default BadgeShowcase;
