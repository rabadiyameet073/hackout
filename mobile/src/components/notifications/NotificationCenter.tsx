import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Surface, 
  Button,
  Chip,
  IconButton,
  Avatar,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';

import { customColors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  type: 'incident_update' | 'validation_request' | 'badge_earned' | 'level_up' | 'system' | 'community';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionable: boolean;
  data?: any;
  imageUrl?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationPress: (notification: Notification) => void;
  onNotificationDismiss: (notificationId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onNotificationPress,
  onNotificationDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const theme = useTheme();
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'incident_update': return 'alert-circle';
      case 'validation_request': return 'checkmark-circle';
      case 'badge_earned': return 'medal';
      case 'level_up': return 'trending-up';
      case 'system': return 'settings';
      case 'community': return 'people';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'incident_update': return customColors.warning;
      case 'validation_request': return customColors.info;
      case 'badge_earned': return customColors.gold;
      case 'level_up': return customColors.success;
      case 'system': return customColors.mangrove;
      case 'community': return customColors.info;
      default: return theme.colors.primary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return customColors.severityCritical;
      case 'high': return customColors.severityHigh;
      case 'medium': return customColors.severityMedium;
      case 'low': return customColors.severityLow;
      default: return theme.colors.primary;
    }
  };

  const filterNotifications = (notifications: Notification[]) => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'actionable':
        return notifications.filter(n => n.actionable);
      default:
        return notifications;
    }
  };

  const filteredNotifications = filterNotifications(notifications);
  const unreadCount = notifications.filter(n => !n.read).length;
  const actionableCount = notifications.filter(n => n.actionable).length;

  const renderRightActions = (notification: Notification) => {
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);

    const handleDismiss = () => {
      translateX.value = withTiming(width, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onNotificationDismiss)(notification.id);
      });
    };

    const handleMarkAsRead = () => {
      onMarkAsRead(notification.id);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    }));

    return (
      <Animated.View style={[styles.rightActions, animatedStyle]}>
        {!notification.read && (
          <Button
            mode="contained"
            onPress={handleMarkAsRead}
            style={[styles.actionButton, { backgroundColor: customColors.info }]}
            labelStyle={styles.actionButtonLabel}
            icon="eye"
          >
            Read
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleDismiss}
          style={[styles.actionButton, { backgroundColor: customColors.severityHigh }]}
          labelStyle={styles.actionButtonLabel}
          icon="close"
        >
          Dismiss
        </Button>
      </Animated.View>
    );
  };

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
    const scale = useSharedValue(0.95);
    const opacity = useSharedValue(0);

    useEffect(() => {
      opacity.value = withTiming(1, { duration: 300, delay: index * 50 });
      scale.value = withSpring(1, { damping: 15 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <Animated.View style={animatedStyle}>
          <Card 
            style={[
              styles.notificationCard,
              !item.read && styles.unreadCard,
              item.priority === 'urgent' && styles.urgentCard,
            ]}
            onPress={() => {
              onNotificationPress(item);
              if (!item.read) {
                onMarkAsRead(item.id);
              }
            }}
          >
            <Card.Content style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationLeft}>
                  <Avatar.Icon
                    size={40}
                    icon={getNotificationIcon(item.type)}
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: getNotificationColor(item.type) + '20' }
                    ]}
                    color={getNotificationColor(item.type)}
                  />
                  
                  <View style={styles.notificationText}>
                    <View style={styles.titleRow}>
                      <Text style={[
                        styles.notificationTitle,
                        !item.read && styles.unreadTitle
                      ]}>
                        {item.title}
                      </Text>
                      {item.priority !== 'low' && (
                        <View 
                          style={[
                            styles.priorityIndicator,
                            { backgroundColor: getPriorityColor(item.priority) }
                          ]}
                        />
                      )}
                    </View>
                    
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {item.message}
                    </Text>
                    
                    <View style={styles.notificationFooter}>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(item.timestamp)}
                      </Text>
                      
                      <View style={styles.notificationBadges}>
                        {item.actionable && (
                          <Chip style={styles.actionableChip} textStyle={styles.chipText}>
                            Action Required
                          </Chip>
                        )}
                        {!item.read && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={() => onNotificationPress(item)}
                />
              </View>

              {item.imageUrl && (
                <Surface style={styles.imageContainer} elevation={1}>
                  <Avatar.Image
                    size={60}
                    source={{ uri: item.imageUrl }}
                    style={styles.notificationImage}
                  />
                </Surface>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </Swipeable>
    );
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Button
                mode="text"
                onPress={onMarkAllAsRead}
                compact
              >
                Mark All Read
              </Button>
            )}
            <IconButton
              icon="trash-can"
              onPress={onClearAll}
              size={20}
            />
          </View>
        </View>
      </Surface>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All ({notifications.length})
        </Chip>
        <Chip
          selected={filter === 'unread'}
          onPress={() => setFilter('unread')}
          style={styles.filterChip}
        >
          Unread ({unreadCount})
        </Chip>
        <Chip
          selected={filter === 'actionable'}
          onPress={() => setFilter('actionable')}
          style={styles.filterChip}
        >
          Action Required ({actionableCount})
        </Chip>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="notifications-off" 
              size={64} 
              color="#CCC" 
            />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : filter === 'actionable'
                ? "No actions required at the moment."
                : "You don't have any notifications yet."
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  filterChip: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    marginBottom: spacing.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: customColors.mangrove,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: customColors.severityCritical,
  },
  notificationContent: {
    paddingVertical: spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    marginRight: spacing.md,
  },
  notificationText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionableChip: {
    height: 24,
    backgroundColor: customColors.warning + '20',
  },
  chipText: {
    fontSize: 10,
    color: customColors.warning,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: customColors.mangrove,
  },
  imageContainer: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: 8,
    overflow: 'hidden',
  },
  notificationImage: {
    borderRadius: 8,
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
  actionButtonLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
});

export default NotificationCenter;
