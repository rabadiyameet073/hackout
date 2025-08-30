import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Surface, 
  Chip,
  Avatar,
  IconButton,
  useTheme 
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../store';
import { fetchIncidents } from '../store/slices/incidentSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { customColors, spacing } from '../utils/theme';

const HomeScreen: React.FC = ({ navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const { incidents, isLoading } = useSelector((state: RootState) => state.incidents);
  const { profile } = useSelector((state: RootState) => state.user);
  const { currentLocation } = useSelector((state: RootState) => state.app);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchIncidents({ limit: 10 })),
        dispatch(fetchUserProfile()),
      ]);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return customColors.severityLow;
      case 'medium': return customColors.severityMedium;
      case 'high': return customColors.severityHigh;
      case 'critical': return customColors.severityCritical;
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Guardian'}! 🌿
            </Text>
            <Text style={styles.subtitle}>
              {currentLocation ? 
                `📍 ${currentLocation.address || 'Current location'}` : 
                'Help protect our mangroves'
              }
            </Text>
          </View>
          <IconButton
            icon="bell-outline"
            size={24}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>
      </Surface>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Avatar.Icon 
              size={40} 
              icon="flag" 
              style={{ backgroundColor: customColors.success }}
            />
            <Text style={styles.statNumber}>{profile?.activity_summary?.total_reports || 0}</Text>
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
            <Text style={styles.statNumber}>{profile?.activity_summary?.total_validations || 0}</Text>
            <Text style={styles.statLabel}>Validations</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Avatar.Icon 
              size={40} 
              icon="star" 
              style={{ backgroundColor: customColors.gold }}
            />
            <Text style={styles.statNumber}>{user?.points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.actionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate('Report')}
              style={styles.primaryAction}
            >
              Report Incident
            </Button>
            <Button
              mode="outlined"
              icon="map"
              onPress={() => navigation.navigate('Map')}
              style={styles.secondaryAction}
            >
              View Map
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Incidents */}
      <Card style={styles.incidentsCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Incidents</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('IncidentList')}
            >
              View All
            </Button>
          </View>

          {incidents.slice(0, 5).map((incident) => (
            <Surface 
              key={incident.id} 
              style={styles.incidentItem}
              elevation={1}
            >
              <View style={styles.incidentHeader}>
                <Ionicons 
                  name={getIncidentIcon(incident.type)} 
                  size={20} 
                  color={theme.colors.primary}
                />
                <Text style={styles.incidentTitle} numberOfLines={1}>
                  {incident.title}
                </Text>
                <Chip 
                  style={[
                    styles.severityChip,
                    { backgroundColor: getSeverityColor(incident.severity) }
                  ]}
                  textStyle={{ color: '#FFFFFF', fontSize: 10 }}
                >
                  {incident.severity.toUpperCase()}
                </Chip>
              </View>
              <Text style={styles.incidentDescription} numberOfLines={2}>
                {incident.description}
              </Text>
              <View style={styles.incidentFooter}>
                <Text style={styles.incidentTime}>
                  {new Date(incident.created_at).toLocaleDateString()}
                </Text>
                <Button
                  mode="text"
                  compact
                  onPress={() => navigation.navigate('IncidentDetail', { id: incident.id })}
                >
                  View Details
                </Button>
              </View>
            </Surface>
          ))}

          {incidents.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No incidents reported yet</Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate('Report')}
                style={styles.emptyAction}
              >
                Report First Incident
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    flex: 1,
  },
  incidentsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  incidentItem: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  incidentTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  severityChip: {
    height: 24,
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.sm,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentTime: {
    fontSize: 12,
    color: '#999',
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

export default HomeScreen;
