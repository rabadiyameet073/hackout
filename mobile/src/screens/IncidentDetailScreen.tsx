import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  Button, 
  Surface, 
  Avatar,
  useTheme 
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

import { RootState, AppDispatch } from '../store';
import { fetchIncidentById } from '../store/slices/incidentSlice';
import { customColors, spacing } from '../utils/theme';

const { width } = Dimensions.get('window');

const IncidentDetailScreen: React.FC = ({ route, navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { incidentId } = route.params;
  
  const { currentIncident, isLoading } = useSelector((state: RootState) => state.incidents);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (incidentId) {
      dispatch(fetchIncidentById(incidentId));
    }
  }, [incidentId]);

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

  if (!currentIncident) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading incident details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Ionicons 
              name={getIncidentIcon(currentIncident.type)} 
              size={24} 
              color={theme.colors.primary}
            />
            <Text style={styles.title}>{currentIncident.title}</Text>
          </View>
          
          <View style={styles.chipRow}>
            <Chip 
              style={[styles.severityChip, { backgroundColor: getSeverityColor(currentIncident.severity) }]}
              textStyle={{ color: '#FFFFFF' }}
            >
              {currentIncident.severity.toUpperCase()}
            </Chip>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(currentIncident.status) }]}
              textStyle={{ color: '#FFFFFF' }}
            >
              {currentIncident.status.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>

          <Text style={styles.description}>{currentIncident.description}</Text>
          
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              Reported by {currentIncident.users?.full_name || 'Anonymous'}
            </Text>
            <Text style={styles.metaText}>
              {new Date(currentIncident.created_at).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Images */}
      {currentIncident.images && currentIncident.images.length > 0 && (
        <Card style={styles.imagesCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {currentIncident.images.map((imageUrl, index) => (
                <Image 
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.image}
                />
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {/* Location */}
      <Card style={styles.locationCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <View style={styles.locationText}>
              <Text style={styles.coordinates}>
                {currentIncident.location.latitude.toFixed(6)}, {currentIncident.location.longitude.toFixed(6)}
              </Text>
              {currentIncident.location.address && (
                <Text style={styles.address}>{currentIncident.location.address}</Text>
              )}
            </View>
          </View>
          
          <MapView
            style={styles.map}
            region={{
              latitude: currentIncident.location.latitude,
              longitude: currentIncident.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: currentIncident.location.latitude,
                longitude: currentIncident.location.longitude,
              }}
              pinColor={getSeverityColor(currentIncident.severity)}
            />
          </MapView>
        </Card.Content>
      </Card>

      {/* Validation Score */}
      <Card style={styles.validationCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Community Validation</Text>
          <View style={styles.validationRow}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreNumber}>{currentIncident.validation_score.toFixed(1)}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceNumber}>{(currentIncident.ai_confidence * 100).toFixed(0)}%</Text>
              <Text style={styles.confidenceLabel}>AI Confidence</Text>
            </View>
          </View>
          
          {currentIncident.validations && currentIncident.validations.length > 0 && (
            <View style={styles.validationsContainer}>
              <Text style={styles.validationsTitle}>
                {currentIncident.validations.length} Validation(s)
              </Text>
              {/* Add validation details here */}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <View style={styles.actionButtons}>
            {user?.id !== currentIncident.user_id && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Validation', { incidentId: currentIncident.id })}
                icon="check-circle"
                style={styles.actionButton}
              >
                Validate
              </Button>
            )}
            
            <Button
              mode="outlined"
              onPress={() => {/* Share functionality */}}
              icon="share"
              style={styles.actionButton}
            >
              Share
            </Button>
            
            {user?.id === currentIncident.user_id && (
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('EditIncident', { incidentId: currentIncident.id })}
                icon="pencil"
                style={styles.actionButton}
              >
                Edit
              </Button>
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  severityChip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  imagesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  locationCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  coordinates: {
    fontSize: 14,
    fontWeight: '500',
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  validationCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.success,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.info,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
  },
  validationsContainer: {
    marginTop: spacing.md,
  },
  validationsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  actionsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default IncidentDetailScreen;
