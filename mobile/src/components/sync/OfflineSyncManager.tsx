import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ProgressBar, 
  Chip,
  List,
  IconButton,
  useTheme 
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { RootState, AppDispatch } from '../../store';
import { syncPendingActions, clearSyncedActions } from '../../store/slices/offlineSlice';
import { customColors, spacing } from '../../utils/theme';

interface OfflineSyncManagerProps {
  visible: boolean;
  onClose: () => void;
}

const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { 
    pendingActions, 
    isSyncing, 
    syncProgress, 
    lastSyncTime,
    syncErrors 
  } = useSelector((state: RootState) => state.offline);
  
  const { networkStatus } = useSelector((state: RootState) => state.app);
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const translateY = useSharedValue(visible ? 0 : 300);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(300, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleSync = () => {
    if (networkStatus === 'online' && pendingActions.length > 0) {
      dispatch(syncPendingActions());
    }
  };

  const handleClearSynced = () => {
    dispatch(clearSyncedActions());
  };

  const toggleExpanded = (actionId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedItems(newExpanded);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CREATE_INCIDENT': return 'add-circle';
      case 'UPDATE_INCIDENT': return 'create';
      case 'VALIDATE_INCIDENT': return 'checkmark-circle';
      case 'UPLOAD_IMAGE': return 'image';
      case 'UPDATE_PROFILE': return 'person';
      default: return 'sync';
    }
  };

  const getActionTitle = (action: any) => {
    switch (action.type) {
      case 'CREATE_INCIDENT': return `Report: ${action.payload.title}`;
      case 'UPDATE_INCIDENT': return `Update: ${action.payload.title}`;
      case 'VALIDATE_INCIDENT': return `Validation for incident`;
      case 'UPLOAD_IMAGE': return `Image upload`;
      case 'UPDATE_PROFILE': return `Profile update`;
      default: return action.type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return customColors.warning;
      case 'syncing': return customColors.info;
      case 'synced': return customColors.success;
      case 'failed': return customColors.severityHigh;
      default: return theme.colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time';
      case 'syncing': return 'sync';
      case 'synced': return 'checkmark-circle';
      case 'failed': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const pendingCount = pendingActions.filter(a => a.status === 'pending').length;
  const syncedCount = pendingActions.filter(a => a.status === 'synced').length;
  const failedCount = pendingActions.filter(a => a.status === 'failed').length;

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Card style={styles.card}>
        <Card.Content>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons 
                name={networkStatus === 'online' ? 'wifi' : 'wifi-off'} 
                size={24} 
                color={networkStatus === 'online' ? customColors.success : customColors.severityHigh}
              />
              <Text style={styles.title}>Offline Sync</Text>
            </View>
            <IconButton icon="close" onPress={onClose} />
          </View>

          {/* Network Status */}
          <View style={styles.statusContainer}>
            <Chip
              icon={networkStatus === 'online' ? 'wifi' : 'wifi-off'}
              style={[
                styles.statusChip,
                { backgroundColor: networkStatus === 'online' ? customColors.success + '20' : customColors.severityHigh + '20' }
              ]}
              textStyle={{ 
                color: networkStatus === 'online' ? customColors.success : customColors.severityHigh 
              }}
            >
              {networkStatus === 'online' ? 'Online' : 'Offline'}
            </Chip>
            
            {lastSyncTime && (
              <Text style={styles.lastSync}>
                Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: customColors.success }]}>{syncedCount}</Text>
              <Text style={styles.statLabel}>Synced</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: customColors.severityHigh }]}>{failedCount}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>

          {/* Sync Progress */}
          {isSyncing && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Syncing... {Math.round(syncProgress)}%</Text>
              <ProgressBar 
                progress={syncProgress / 100} 
                style={styles.progressBar}
                color={customColors.mangrove}
              />
            </View>
          )}

          {/* Actions List */}
          {pendingActions.length > 0 && (
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Pending Actions</Text>
              {pendingActions.map((action) => (
                <View key={action.id} style={styles.actionItem}>
                  <List.Item
                    title={getActionTitle(action)}
                    description={`${action.timestamp} • ${action.status}`}
                    left={() => (
                      <View style={styles.actionIconContainer}>
                        <Ionicons 
                          name={getActionIcon(action.type)} 
                          size={20} 
                          color={theme.colors.primary}
                        />
                      </View>
                    )}
                    right={() => (
                      <View style={styles.actionStatus}>
                        <Ionicons 
                          name={getStatusIcon(action.status)} 
                          size={16} 
                          color={getStatusColor(action.status)}
                        />
                        <IconButton
                          icon={expandedItems.has(action.id) ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          onPress={() => toggleExpanded(action.id)}
                        />
                      </View>
                    )}
                    onPress={() => toggleExpanded(action.id)}
                  />
                  
                  {expandedItems.has(action.id) && (
                    <View style={styles.actionDetails}>
                      <Text style={styles.actionDetailsTitle}>Details:</Text>
                      <Text style={styles.actionDetailsText}>
                        {JSON.stringify(action.payload, null, 2)}
                      </Text>
                      
                      {action.error && (
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorTitle}>Error:</Text>
                          <Text style={styles.errorText}>{action.error}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSync}
              disabled={networkStatus === 'offline' || pendingCount === 0 || isSyncing}
              icon="sync"
              style={styles.syncButton}
            >
              {isSyncing ? 'Syncing...' : `Sync ${pendingCount} Actions`}
            </Button>
            
            {syncedCount > 0 && (
              <Button
                mode="outlined"
                onPress={handleClearSynced}
                icon="trash"
                style={styles.clearButton}
              >
                Clear Synced
              </Button>
            )}
          </View>

          {/* Sync Errors */}
          {syncErrors.length > 0 && (
            <View style={styles.errorsContainer}>
              <Text style={styles.errorsTitle}>Recent Errors:</Text>
              {syncErrors.slice(0, 3).map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Ionicons name="alert-circle" size={16} color={customColors.severityHigh} />
                  <Text style={styles.errorItemText}>{error}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {pendingActions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color={customColors.success} />
              <Text style={styles.emptyTitle}>All Synced!</Text>
              <Text style={styles.emptyText}>
                No pending actions. Your data is up to date.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  card: {
    margin: spacing.md,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusChip: {
    height: 32,
  },
  lastSync: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressText: {
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  actionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  actionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionDetails: {
    padding: spacing.md,
    backgroundColor: '#F9F9F9',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  actionDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  actionDetailsText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#666',
  },
  errorContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: customColors.severityHigh + '10',
    borderRadius: 4,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: customColors.severityHigh,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 10,
    color: customColors.severityHigh,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  syncButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
    borderColor: customColors.severityHigh,
  },
  errorsContainer: {
    marginBottom: spacing.md,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customColors.severityHigh,
    marginBottom: spacing.sm,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  errorItemText: {
    fontSize: 12,
    color: customColors.severityHigh,
    marginLeft: spacing.sm,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: customColors.success,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default OfflineSyncManager;
