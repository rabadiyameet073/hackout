import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { 
  Text, 
  FAB, 
  Surface, 
  Button,
  Chip,
  Portal,
  Modal,
  Card,
  useTheme 
} from 'react-native-paper';
import MapView, { 
  Marker, 
  Callout, 
  PROVIDER_GOOGLE, 
  Heatmap,
  Circle,
  Region 
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface Incident {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
  images?: string[];
  validation_score: number;
}

interface MapFilter {
  types: string[];
  severities: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  validationThreshold: number;
}

interface AdvancedMapViewProps {
  incidents: Incident[];
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  onIncidentPress: (incident: Incident) => void;
  onReportPress: (location: { latitude: number; longitude: number }) => void;
  onFilterChange?: (filter: MapFilter) => void;
}

const AdvancedMapView: React.FC<AdvancedMapViewProps> = ({
  incidents,
  currentLocation,
  onIncidentPress,
  onReportPress,
  onFilterChange,
}) => {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: currentLocation?.latitude || 14.5995,
    longitude: currentLocation?.longitude || 120.9842,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap' | 'clusters'>('markers');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<MapFilter>({
    types: [],
    severities: [],
    dateRange: {},
    validationThreshold: 0,
  });

  const fabScale = useSharedValue(1);
  const filterOpacity = useSharedValue(0);

  useEffect(() => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [currentLocation]);

  useEffect(() => {
    filterOpacity.value = withTiming(filterVisible ? 1 : 0, { duration: 300 });
  }, [filterVisible]);

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

  const filterIncidents = (incidents: Incident[]): Incident[] => {
    return incidents.filter(incident => {
      // Type filter
      if (filter.types.length > 0 && !filter.types.includes(incident.type)) {
        return false;
      }
      
      // Severity filter
      if (filter.severities.length > 0 && !filter.severities.includes(incident.severity)) {
        return false;
      }
      
      // Validation threshold
      if (incident.validation_score < filter.validationThreshold) {
        return false;
      }
      
      // Date range filter
      if (filter.dateRange.start || filter.dateRange.end) {
        const incidentDate = new Date(incident.created_at);
        if (filter.dateRange.start && incidentDate < filter.dateRange.start) {
          return false;
        }
        if (filter.dateRange.end && incidentDate > filter.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredIncidents = filterIncidents(incidents);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onReportPress({ latitude, longitude });
  };

  const handleMarkerPress = (incident: Incident) => {
    setSelectedIncident(incident);
    
    // Animate to marker
    mapRef.current?.animateToRegion({
      latitude: incident.location.latitude,
      longitude: incident.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleFABPress = () => {
    fabScale.value = withSpring(0.9, {}, () => {
      fabScale.value = withSpring(1);
    });
    
    if (currentLocation) {
      onReportPress(currentLocation);
    }
  };

  const animatedFABStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const animatedFilterStyle = useAnimatedStyle(() => ({
    opacity: filterOpacity.value,
  }));

  const renderMarkers = () => {
    if (viewMode !== 'markers') return null;

    return filteredIncidents.map((incident) => (
      <Marker
        key={incident.id}
        coordinate={{
          latitude: incident.location.latitude,
          longitude: incident.location.longitude,
        }}
        pinColor={getSeverityColor(incident.severity)}
        onPress={() => handleMarkerPress(incident)}
      >
        <Callout onPress={() => onIncidentPress(incident)}>
          <View style={styles.calloutContainer}>
            <View style={styles.calloutHeader}>
              <Ionicons 
                name={getIncidentIcon(incident.type)} 
                size={16} 
                color={theme.colors.primary}
              />
              <Text style={styles.calloutTitle} numberOfLines={1}>
                {incident.title}
              </Text>
            </View>
            <Text style={styles.calloutDescription} numberOfLines={2}>
              {incident.description}
            </Text>
            <View style={styles.calloutFooter}>
              <Chip 
                style={[
                  styles.calloutChip,
                  { backgroundColor: getSeverityColor(incident.severity) }
                ]}
                textStyle={{ color: '#FFFFFF', fontSize: 10 }}
              >
                {incident.severity.toUpperCase()}
              </Chip>
              <Text style={styles.calloutDate}>
                {new Date(incident.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  const renderHeatmap = () => {
    if (viewMode !== 'heatmap') return null;

    const heatmapPoints = filteredIncidents.map(incident => ({
      latitude: incident.location.latitude,
      longitude: incident.location.longitude,
      weight: incident.severity === 'critical' ? 1 : 
              incident.severity === 'high' ? 0.8 :
              incident.severity === 'medium' ? 0.6 : 0.4,
    }));

    return (
      <Heatmap
        points={heatmapPoints}
        radius={50}
        opacity={0.7}
        gradient={{
          colors: ['#00FF00', '#FFFF00', '#FF0000'],
          startPoints: [0.2, 0.5, 1.0],
          colorMapSize: 256,
        }}
      />
    );
  };

  const renderClusters = () => {
    if (viewMode !== 'clusters') return null;

    // Simple clustering logic - group nearby incidents
    const clusters = new Map();
    const clusterRadius = 0.01; // degrees

    filteredIncidents.forEach(incident => {
      let clustered = false;
      
      for (const [key, cluster] of clusters) {
        const distance = Math.sqrt(
          Math.pow(cluster.latitude - incident.location.latitude, 2) +
          Math.pow(cluster.longitude - incident.location.longitude, 2)
        );
        
        if (distance < clusterRadius) {
          cluster.incidents.push(incident);
          cluster.count = cluster.incidents.length;
          clustered = true;
          break;
        }
      }
      
      if (!clustered) {
        clusters.set(incident.id, {
          latitude: incident.location.latitude,
          longitude: incident.location.longitude,
          incidents: [incident],
          count: 1,
        });
      }
    });

    return Array.from(clusters.values()).map((cluster, index) => (
      <Marker
        key={index}
        coordinate={{
          latitude: cluster.latitude,
          longitude: cluster.longitude,
        }}
      >
        <View style={[styles.clusterMarker, { backgroundColor: customColors.mangrove }]}>
          <Text style={styles.clusterText}>{cluster.count}</Text>
        </View>
        <Callout>
          <View style={styles.clusterCallout}>
            <Text style={styles.clusterCalloutTitle}>
              {cluster.count} Incident{cluster.count > 1 ? 's' : ''}
            </Text>
            {cluster.incidents.slice(0, 3).map((incident, idx) => (
              <Text key={idx} style={styles.clusterIncidentTitle}>
                • {incident.title}
              </Text>
            ))}
            {cluster.count > 3 && (
              <Text style={styles.clusterMore}>
                +{cluster.count - 3} more...
              </Text>
            )}
          </View>
        </Callout>
      </Marker>
    ));
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Current Location */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="You are here"
            pinColor={customColors.info}
          />
        )}

        {/* Render based on view mode */}
        {renderMarkers()}
        {renderHeatmap()}
        {renderClusters()}

        {/* Danger zones (example) */}
        {filteredIncidents
          .filter(i => i.severity === 'critical')
          .map(incident => (
            <Circle
              key={`danger-${incident.id}`}
              center={{
                latitude: incident.location.latitude,
                longitude: incident.location.longitude,
              }}
              radius={500}
              fillColor={customColors.severityCritical + '20'}
              strokeColor={customColors.severityCritical}
              strokeWidth={2}
            />
          ))}
      </MapView>

      {/* Map Controls */}
      <Surface style={styles.controlsContainer} elevation={4}>
        <View style={styles.controlsHeader}>
          <Text style={styles.controlsTitle}>
            {filteredIncidents.length} incidents
          </Text>
          <Button
            mode="outlined"
            icon="filter"
            onPress={() => setFilterVisible(true)}
            compact
          >
            Filter
          </Button>
        </View>
        
        <View style={styles.viewModeContainer}>
          <Chip
            selected={viewMode === 'markers'}
            onPress={() => setViewMode('markers')}
            style={styles.viewModeChip}
          >
            Markers
          </Chip>
          <Chip
            selected={viewMode === 'heatmap'}
            onPress={() => setViewMode('heatmap')}
            style={styles.viewModeChip}
          >
            Heatmap
          </Chip>
          <Chip
            selected={viewMode === 'clusters'}
            onPress={() => setViewMode('clusters')}
            style={styles.viewModeChip}
          >
            Clusters
          </Chip>
        </View>
      </Surface>

      {/* Legend */}
      <Surface style={styles.legendContainer} elevation={2}>
        <Text style={styles.legendTitle}>Severity</Text>
        <View style={styles.legendItems}>
          {[
            { severity: 'low', label: 'Low' },
            { severity: 'medium', label: 'Medium' },
            { severity: 'high', label: 'High' },
            { severity: 'critical', label: 'Critical' },
          ].map(({ severity, label }) => (
            <View key={severity} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: getSeverityColor(severity) }
                ]} 
              />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </Surface>

      {/* Floating Action Button */}
      <Animated.View style={[styles.fabContainer, animatedFABStyle]}>
        <FAB
          icon="plus"
          onPress={handleFABPress}
          style={styles.fab}
          label="Report"
        />
      </Animated.View>

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text style={styles.modalTitle}>Filter Incidents</Text>
              
              {/* Filter content would go here */}
              <Text style={styles.modalSubtitle}>
                Advanced filtering options coming soon...
              </Text>
              
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setFilterVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    onFilterChange?.(filter);
                    setFilterVisible(false);
                  }}
                  style={styles.modalButton}
                >
                  Apply
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  controlsContainer: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewModeChip: {
    flex: 1,
  },
  legendContainer: {
    position: 'absolute',
    bottom: 100,
    left: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  fabContainer: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
  fab: {
    backgroundColor: customColors.mangrove,
  },
  calloutContainer: {
    width: 200,
    padding: spacing.sm,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
    flex: 1,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: spacing.sm,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calloutChip: {
    height: 20,
  },
  calloutDate: {
    fontSize: 10,
    color: '#999',
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clusterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clusterCallout: {
    width: 200,
    padding: spacing.sm,
  },
  clusterCalloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  clusterIncidentTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  clusterMore: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  modalContainer: {
    margin: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});

export default AdvancedMapView;
