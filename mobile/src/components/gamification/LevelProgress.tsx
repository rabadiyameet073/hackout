import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Surface, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Svg, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { customColors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 120;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface LevelProgressProps {
  currentLevel: number;
  currentPoints: number;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  levelName: string;
  nextLevelName: string;
  animated?: boolean;
}

const LevelProgress: React.FC<LevelProgressProps> = ({
  currentLevel,
  currentPoints,
  nextLevelPoints,
  pointsToNextLevel,
  levelName,
  nextLevelName,
  animated = true,
}) => {
  const theme = useTheme();
  
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const progressPercentage = ((nextLevelPoints - pointsToNextLevel) / nextLevelPoints) * 100;
  const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * progressPercentage) / 100;

  useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 500 });
      progress.value = withTiming(progressPercentage, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
      scale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
    } else {
      opacity.value = 1;
      progress.value = progressPercentage;
    }
  }, [progressPercentage, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getLevelIcon = (level: number) => {
    if (level >= 10) return '👑';
    if (level >= 8) return '🦸';
    if (level >= 6) return '🏞️';
    if (level >= 4) return '🌲';
    if (level >= 2) return '🌿';
    return '🌱';
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return customColors.gold;
    if (level >= 8) return customColors.platinum;
    if (level >= 6) return customColors.silver;
    if (level >= 4) return customColors.bronze;
    return customColors.mangrove;
  };

  return (
    <Card style={styles.container}>
      <LinearGradient
        colors={[getLevelColor(currentLevel) + '20', getLevelColor(currentLevel) + '10']}
        style={styles.gradient}
      >
        <Card.Content style={styles.content}>
          <Text style={styles.title}>Level Progress</Text>
          
          <Animated.View style={[styles.circleContainer, animatedStyle]}>
            <Surface style={styles.circleSurface} elevation={4}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
                <Defs>
                  <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={getLevelColor(currentLevel)} />
                    <Stop offset="100%" stopColor={getLevelColor(currentLevel) + '80'} />
                  </SvgLinearGradient>
                </Defs>
                
                {/* Background Circle */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke="#E0E0E0"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />
                
                {/* Progress Circle */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke="url(#gradient)"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                />
              </Svg>
              
              <View style={styles.circleContent}>
                <Text style={styles.levelIcon}>{getLevelIcon(currentLevel)}</Text>
                <Text style={styles.levelNumber}>{currentLevel}</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(progressPercentage)}%
                </Text>
              </View>
            </Surface>
          </Animated.View>

          <View style={styles.levelInfo}>
            <View style={styles.currentLevel}>
              <Text style={styles.levelLabel}>Current Level</Text>
              <Text style={[styles.levelName, { color: getLevelColor(currentLevel) }]}>
                {levelName}
              </Text>
            </View>

            <View style={styles.nextLevel}>
              <Text style={styles.levelLabel}>Next Level</Text>
              <Text style={styles.nextLevelName}>{nextLevelName}</Text>
            </View>
          </View>

          <View style={styles.pointsInfo}>
            <View style={styles.pointsRow}>
              <View style={styles.pointsItem}>
                <Text style={styles.pointsNumber}>{currentPoints.toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>Current Points</Text>
              </View>
              
              <View style={styles.pointsItem}>
                <Text style={[styles.pointsNumber, { color: customColors.warning }]}>
                  {pointsToNextLevel.toLocaleString()}
                </Text>
                <Text style={styles.pointsLabel}>Points to Go</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: getLevelColor(currentLevel),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressBarText}>
                {(nextLevelPoints - pointsToNextLevel).toLocaleString()} / {nextLevelPoints.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Level Benefits Preview */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Next Level Benefits:</Text>
            <View style={styles.benefitsList}>
              {getNextLevelBenefits(currentLevel + 1).map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✨</Text>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </LinearGradient>
    </Card>
  );
};

const getNextLevelBenefits = (level: number): string[] => {
  const benefits: Record<number, string[]> = {
    2: ['Enhanced reporting features', 'Profile customization'],
    3: ['Advanced filters', 'Incident analytics'],
    4: ['Expert validation access', 'Priority support'],
    5: ['Mentor status', 'Beta features access'],
    6: ['Community moderation', 'Special recognition'],
    7: ['Research collaboration', 'Policy input'],
    8: ['Leadership opportunities', 'Conference invitations'],
    9: ['Global recognition', 'Award nominations'],
    10: ['Lifetime achievement', 'Hall of fame'],
  };
  
  return benefits[level] || ['Exclusive features', 'Special privileges'];
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 12,
  },
  content: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: customColors.mangrove,
  },
  circleContainer: {
    marginBottom: spacing.lg,
  },
  circleSurface: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  svg: {
    position: 'absolute',
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.xs,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
  },
  currentLevel: {
    alignItems: 'center',
    flex: 1,
  },
  nextLevel: {
    alignItems: 'center',
    flex: 1,
  },
  levelLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: spacing.xs,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextLevelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  pointsInfo: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pointsItem: {
    alignItems: 'center',
    flex: 1,
  },
  pointsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.xs,
  },
  progressBar: {
    width: '100%',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  benefitsSection: {
    width: '100%',
    marginTop: spacing.md,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: customColors.mangrove,
  },
  benefitsList: {
    gap: spacing.xs,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 12,
    marginRight: spacing.sm,
  },
  benefitText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default LevelProgress;
