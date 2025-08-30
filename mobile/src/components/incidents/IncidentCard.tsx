import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  Button, 
  Avatar,
  Surface,
  IconButton,
  ProgressBar,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';

import { customColors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');

interface Incident {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | 'resolved';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  images?: string[];
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    level: number;
  };
  validation_score: number;
  validation_count: number;
  ai_confidence: number;
  tags?: string[];
  urgency_level?: number;
  estimated_impact?: string;
}

interface IncidentCardProps {
  incident: Incident;
  onPress: (incident: Incident) => void;
  onValidate?: (incident: Incident) => void;
  onShare?: (incident: Incident) => void;
  onBookmark?: (incident: Incident) => void;
  onReport?: (incident: Incident) => void;
  showActions?: boolean;
  compact?: boolean;
  showValidation?: boolean;
}

const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onPress,
  onValidate,
  onShare,
  onBookmark,
  onReport,
  showActions = true,
  compact = false,
  showValidation = true,
}) => {
  const theme = useTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return customColors.severityLow;
      case 'medium': return customColors.severityMedium;
      case 'high': return customColors.severityHigh;
      case 'critical': return customColors.severityCritical;
      default: return theme.colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return customColors.statusPending;
      case 'under_review': return customColors.statusUnderReview;
      case 'verified': return customColors.statusVerified;
      case 'rejected': return customColors.statusRejected;
      case 'resolved': return customColors.statusResolved;
      default: return theme.colors.primary;
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'illegal_cutting': return 'cut';
      case 'pollution': return 'warning';
      case 'land_reclamation': return 'construct';
      case 'wildlife_disturbance': return 'paw';
      default: return 'alert-circle';
    }
  };

  const getUrgencyIcon = (urgency?: number) => {
    if (!urgency) return null;
    if (urgency >= 8) return '🚨';
    if (urgency >= 6) return '⚠️';
    if (urgency >= 4) return '⚡';
    return '📍';
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  };

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
    onPress(incident);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(incident);
  };

  const handleValidate = () => {
    onValidate?.(incident);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <Button
        mode="contained"
        onPress={() => onShare?.(incident)}
        style={[styles.actionButton, { backgroundColor: customColors.info }]}
        icon="share"
        compact
      >
        Share
      </Button>
      <Button
        mode="contained"
        onPress={() => onReport?.(incident)}
        style={[styles.actionButton, { backgroundColor: customColors.severityHigh }]}
        icon="flag"
        compact
      >
        Report
      </Button>
    </View>
  );

  const renderCompactCard = () => (
    <Animated.View style={animatedStyle}>
      <Card style={styles.compactCard} onPress={handlePress}>
        <Card.Content style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <View style={styles.compactLeft}>
              <Ionicons 
                name={getIncidentIcon(incident.type)} 
                size={20} 
                color={getSeverityColor(incident.severity)}
              />
              <View style={styles.compactInfo}>
                <Text style={styles.compactTitle} numberOfLines={1}>
                  {incident.title}
                </Text>
                <Text style={styles.compactMeta}>
                  {formatTimeAgo(incident.created_at)} • {incident.location.address || 'Unknown location'}
                </Text>
              </View>
            </View>
            <View style={styles.compactRight}>
              <Chip 
                style={[styles.compactChip, { backgroundColor: getSeverityColor(incident.severity) }]}
                textStyle={{ color: '#FFFFFF', fontSize: 10 }}
              >
                {incident.severity.toUpperCase()}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  if (compact) {
    return renderCompactCard();
  }

  return (
    <Swipeable renderRightActions={showActions ? renderRightActions : undefined}>
      <Animated.View style={animatedStyle}>
        <Card style={styles.incidentCard} onPress={handlePress}>
          {/* Urgency Indicator */}
          {incident.urgency_level && incident.urgency_level >= 7 && (
            <LinearGradient
              colors={[customColors.severityCritical, customColors.severityCritical + '80']}
              style={styles.urgencyBanner}
            >
              <Text style={styles.urgencyText}>
                {getUrgencyIcon(incident.urgency_level)} URGENT INCIDENT
              </Text>
            </LinearGradient>
          )}

          <Card.Content style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Avatar.Image
                  size={40}
                  source={incident.user.avatar_url ? { uri: incident.user.avatar_url } : undefined}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{incident.user.full_name}</Text>
                  <Text style={styles.userLevel}>Level {incident.user.level}</Text>
                </View>
              </View>
              
              <View style={styles.headerRight}>
                <Text style={styles.timeAgo}>{formatTimeAgo(incident.created_at)}</Text>
                <IconButton
                  icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                  onPress={handleBookmark}
                  size={20}
                  iconColor={isBookmarked ? customColors.warning : undefined}
                />
              </View>
            </View>

            {/* Title and Type */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <Ionicons 
                  name={getIncidentIcon(incident.type)} 
                  size={24} 
                  color={getSeverityColor(incident.severity)}
                />
                <Text style={styles.title}>{incident.title}</Text>
              </View>
              
              <View style={styles.statusRow}>
                <Chip 
                  style={[styles.severityChip, { backgroundColor: getSeverityColor(incident.severity) }]}
                  textStyle={{ color: '#FFFFFF' }}
                >
                  {incident.severity.toUpperCase()}
                </Chip>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(incident.status) }]}
                  textStyle={{ color: '#FFFFFF' }}
                >
                  {incident.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </View>

            {/* Description */}
            <Text 
              style={styles.description}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {incident.description}
            </Text>
            
            {incident.description.length > 150 && (
              <Button
                mode="text"
                onPress={() => setShowFullDescription(!showFullDescription)}
                compact
                style={styles.readMoreButton}
              >
                {showFullDescription ? 'Show Less' : 'Read More'}
              </Button>
            )}

            {/* Images */}
            {incident.images && incident.images.length > 0 && (
              <View style={styles.imagesContainer}>
                <Image 
                  source={{ uri: incident.images[0] }}
                  style={styles.mainImage}
                />
                {incident.images.length > 1 && (
                  <Surface style={styles.imageCounter} elevation={2}>
                    <Text style={styles.imageCounterText}>
                      +{incident.images.length - 1}
                    </Text>
                  </Surface>
                )}
              </View>
            )}

            {/* Location */}
            <View style={styles.locationSection}>
              <Ionicons name="location" size={16} color={theme.colors.primary} />
              <Text style={styles.locationText}>
                {incident.location.address || `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`}
              </Text>
            </View>

            {/* Tags */}
            {incident.tags && incident.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {incident.tags.slice(0, 3).map((tag, index) => (
                  <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                    #{tag}
                  </Chip>
                ))}
                {incident.tags.length > 3 && (
                  <Text style={styles.moreTags}>+{incident.tags.length - 3} more</Text>
                )}
              </View>
            )}

            {/* Validation Section */}
            {showValidation && (
              <View style={styles.validationSection}>
                <View style={styles.validationHeader}>
                  <Text style={styles.validationTitle}>Community Validation</Text>
                  <Text style={styles.validationScore}>
                    {incident.validation_score.toFixed(1)}/5.0
                  </Text>
                </View>
                
                <View style={styles.validationBar}>
                  <ProgressBar
                    progress={incident.validation_score / 5}
                    color={
                      incident.validation_score >= 4 ? customColors.success :
                      incident.validation_score >= 3 ? customColors.warning :
                      customColors.severityHigh
                    }
                    style={styles.progressBar}
                  />
                  <Text style={styles.validationCount}>
                    {incident.validation_count} validation{incident.validation_count !== 1 ? 's' : ''}
                  </Text>
                </View>

                {incident.ai_confidence > 0 && (
                  <View style={styles.aiSection}>
                    <Ionicons name="brain" size={14} color={customColors.info} />
                    <Text style={styles.aiText}>
                      AI Confidence: {Math.round(incident.ai_confidence * 100)}%
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Impact Estimate */}
            {incident.estimated_impact && (
              <Surface style={styles.impactSection} elevation={1}>
                <Ionicons name="analytics" size={16} color={customColors.warning} />
                <Text style={styles.impactText}>
                  Estimated Impact: {incident.estimated_impact}
                </Text>
              </Surface>
            )}

            {/* Action Buttons */}
            {showActions && (
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={handleValidate}
                  icon="checkmark-circle"
                  style={styles.actionBtn}
                  disabled={incident.status === 'resolved'}
                >
                  Validate
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => onShare?.(incident)}
                  icon="share"
                  style={styles.actionBtn}
                >
                  Share
                </Button>
                <Button
                  mode="contained"
                  onPress={handlePress}
                  icon="eye"
                  style={styles.actionBtn}
                >
                  View Details
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  incidentCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  compactCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  urgencyBanner: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    paddingVertical: spacing.md,
  },
  compactContent: {
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  compactInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
  },
  userLevel: {
    fontSize: 12,
    color: '#666',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  compactRight: {
    marginLeft: spacing.sm,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    marginBottom: spacing.xs,
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactMeta: {
    fontSize: 12,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  severityChip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  compactChip: {
    height: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: spacing.sm,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  imagesContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  mainImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imageCounter: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: spacing.xs,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    height: 24,
    backgroundColor: customColors.mangrove + '20',
  },
  tagText: {
    fontSize: 10,
    color: customColors.mangrove,
  },
  moreTags: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  validationSection: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  validationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  validationScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: customColors.success,
  },
  validationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    marginRight: spacing.sm,
  },
  validationCount: {
    fontSize: 12,
    color: '#666',
  },
  aiSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiText: {
    fontSize: 12,
    color: customColors.info,
    marginLeft: spacing.xs,
  },
  impactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    backgroundColor: customColors.warning + '10',
  },
  impactText: {
    fontSize: 12,
    color: customColors.warning,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  actionButton: {
    marginLeft: spacing.sm,
    minWidth: 80,
  },
});

export default IncidentCard;
