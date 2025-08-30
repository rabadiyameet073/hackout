import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { customColors, spacing } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface Achievement {
  type: 'badge' | 'level' | 'points';
  title: string;
  description: string;
  icon: string;
  points?: number;
  level?: number;
  badgeRarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  visible: boolean;
  onDismiss: () => void;
  onViewDetails?: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  visible,
  onDismiss,
  onViewDetails,
}) => {
  const translateY = useSharedValue(-height);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievement) {
      // Entry animation
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(height * 0.3, {
        damping: 15,
        stiffness: 100,
      });
      scale.value = withSpring(1, { damping: 12 });
      
      // Icon animation with delay
      iconScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.3, { damping: 8 }),
          withSpring(1, { damping: 8 })
        )
      );

      // Sparkle effect
      sparkleOpacity.value = withSequence(
        withDelay(300, withTiming(1, { duration: 500 })),
        withTiming(0, { duration: 1000 })
      );

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible, achievement]);

  const handleDismiss = () => {
    translateY.value = withTiming(-height, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 });
    
    setTimeout(() => {
      runOnJS(onDismiss)();
    }, 300);
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return customColors.gold;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'badge': return customColors.gold;
      case 'level': return customColors.mangrove;
      case 'points': return customColors.success;
      default: return customColors.primary;
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'badge': return '🏆 Badge Earned!';
      case 'level': return '⬆️ Level Up!';
      case 'points': return '⭐ Points Earned!';
      default: return '🎉 Achievement!';
    }
  };

  if (!visible || !achievement) {
    return null;
  }

  const primaryColor = achievement.type === 'badge' 
    ? getRarityColor(achievement.badgeRarity)
    : getTypeColor(achievement.type);

  return (
    <View style={styles.overlay}>
      <BlurView intensity={20} style={styles.blurView}>
        <Animated.View style={[styles.container, animatedContainerStyle]}>
          <Surface style={styles.notification} elevation={8}>
            <LinearGradient
              colors={[primaryColor + '20', primaryColor + '10', '#FFFFFF']}
              style={styles.gradient}
            >
              {/* Sparkle Effects */}
              <Animated.View style={[styles.sparkleContainer, animatedSparkleStyle]}>
                {[...Array(6)].map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.sparkle,
                      {
                        left: `${20 + index * 12}%`,
                        top: `${10 + (index % 2) * 20}%`,
                        transform: [
                          {
                            rotate: withSequence(
                              withDelay(
                                index * 100,
                                withTiming('360deg', { duration: 2000 })
                              )
                            ),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.sparkleText}>✨</Text>
                  </Animated.View>
                ))}
              </Animated.View>

              <View style={styles.content}>
                <Text style={styles.typeTitle}>{getTypeTitle(achievement.type)}</Text>
                
                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                  <View style={[styles.iconBackground, { backgroundColor: primaryColor + '20' }]}>
                    <Text style={styles.icon}>{achievement.icon}</Text>
                  </View>
                </Animated.View>

                <Text style={styles.title}>{achievement.title}</Text>
                <Text style={styles.description}>{achievement.description}</Text>

                {achievement.points && (
                  <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>
                      +{achievement.points} points earned!
                    </Text>
                  </View>
                )}

                {achievement.level && (
                  <View style={styles.levelContainer}>
                    <Text style={styles.levelText}>
                      Welcome to Level {achievement.level}!
                    </Text>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  {onViewDetails && (
                    <Button
                      mode="contained"
                      onPress={() => {
                        onViewDetails();
                        handleDismiss();
                      }}
                      style={[styles.button, { backgroundColor: primaryColor }]}
                      labelStyle={styles.buttonLabel}
                    >
                      View Details
                    </Button>
                  )}
                  
                  <Button
                    mode="outlined"
                    onPress={handleDismiss}
                    style={[styles.button, { borderColor: primaryColor }]}
                    labelStyle={[styles.buttonLabel, { color: primaryColor }]}
                  >
                    Awesome!
                  </Button>
                </View>
              </View>
            </LinearGradient>
          </Surface>
        </Animated.View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  blurView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
  },
  notification: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: spacing.xl,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 16,
  },
  content: {
    alignItems: 'center',
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: customColors.mangrove,
    marginBottom: spacing.md,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: '#333',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  pointsContainer: {
    backgroundColor: customColors.success + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customColors.success,
  },
  levelContainer: {
    backgroundColor: customColors.mangrove + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AchievementNotification;
