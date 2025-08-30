import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  Surface, 
  Button,
  Searchbar,
  useTheme 
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../store';
import { fetchIncidents } from '../store/slices/incidentSlice';
import { customColors, spacing } from '../utils/theme';

const IncidentListScreen: React.FC = ({ navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { incidents, isLoading, pagination } = useSelector((state: RootState) => state.incidents);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      await dispatch(fetchIncidents({ page: 1, limit: 20 }));
    } catch (error) {
      console.error('Failed to load incidents:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
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

  const renderIncident = ({ item }: { item: any }) => (
    <Card style={styles.incidentCard} onPress={() => navigation.navigate('IncidentDetail', { id: item.id })}>
      <Card.Content>
        <View style={styles.incidentHeader}>
          <Ionicons 
            name={getIncidentIcon(item.type)} 
            size={20} 
            color={theme.colors.primary}
          />
          <Text style={styles.incidentTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Chip 
            style={[
              styles.severityChip,
              { backgroundColor: getSeverityColor(item.severity) }
            ]}
            textStyle={{ color: '#FFFFFF', fontSize: 10 }}
          >
            {item.severity.toUpperCase()}
          </Chip>
        </View>
        
        <Text style={styles.incidentDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.incidentFooter}>
          <Text style={styles.incidentMeta}>
            By {item.users?.full_name || 'Anonymous'}
          </Text>
          <Text style={styles.incidentDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.searchContainer} elevation={2}>
        <Searchbar
          placeholder="Search incidents..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </Surface>

      <FlatList
        data={incidents}
        renderItem={renderIncident}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No incidents found</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Report')}
              icon="plus"
              style={styles.emptyButton}
            >
              Report First Incident
            </Button>
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: spacing.md,
  },
  incidentCard: {
    marginBottom: spacing.md,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    lineHeight: 20,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentMeta: {
    fontSize: 12,
    color: '#999',
  },
  incidentDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
});

export default IncidentListScreen;
