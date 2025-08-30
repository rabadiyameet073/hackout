import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { 
  Text, 
  FAB, 
  Surface, 
  Chip,
  Button,
  useTheme 
} from 'react-native-paper';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../store';
import { fetchNearbyIncidents } from '../store/slices/incidentSlice';
import { customColors, spacing } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC = ({ navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { nearbyIncidents, isLoading } = useSelector((state: RootState) => state.incidents);
  const { currentLocation } = useSelector((state: RootState) => state.app);
  
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: currentLocation?.latitude || 14.5995, // Default to Philippines
    longitude: currentLocation?.longitude || 120.9842,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      
      // Fetch nearby incidents
      dispatch(fetchNearbyIncidents({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        radius: 10,
      }));
    }
  }, [currentLocation, dispatch]);

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

  const handleMarkerPress = (incident: any) => {
    setSelectedIncident(incident);
  };

  const handleReportHere = () => {
    navigation.navigate('Report', { 
      location: {
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
      }
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description="You are here"
            pinColor={customColors.info}
          />
        )}

        {/* Incident Markers */}
        {nearbyIncidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.location.latitude,
              longitude: incident.location.longitude,
            }}
            pinColor={getSeverityColor(incident.severity)}
            onPress={() => handleMarkerPress(incident)}
          >
            <Callout
              onPress={() => navigation.navigate('IncidentDetail', { id: incident.id })}
            >
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
        ))}
      </MapView>

      {/* Map Controls */}
      <Surface style={styles.controlsContainer} elevation={4}>
        <Text style={styles.controlsTitle}>
          {nearbyIncidents.length} incidents in this area
        </Text>
        <View style={styles.controlsButtons}>
          <Button
            mode="outlined"
            icon="refresh"
            onPress={() => {
              if (currentLocation) {
                dispatch(fetchNearbyIncidents({
                  lat: mapRegion.latitude,
                  lng: mapRegion.longitude,
                  radius: 10,
                }));
              }
            }}
            loading={isLoading}
            style={styles.controlButton}
          >
            Refresh
          </Button>
          <Button
            mode="outlined"
            icon="filter"
            onPress={() => {
              // TODO: Implement filter modal
            }}
            style={styles.controlButton}
          >
            Filter
          </Button>
        </View>
      </Surface>

      {/* Legend */}
      <Surface style={styles.legendContainer} elevation={2}>
        <Text style={styles.legendTitle}>Severity Levels</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: customColors.severityLow }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: customColors.severityMedium }]} />
            <Text style={styles.legendText}>Medium</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: customColors.severityHigh }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: customColors.severityCritical }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>
        </View>
      </Surface>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleReportHere}
        label="Report Here"
      />
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
  controlsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  controlsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
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
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
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
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
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
});

export default MapScreen;
