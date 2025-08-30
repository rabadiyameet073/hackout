import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Chip,
  Surface,
  ProgressBar,
  useTheme 
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { RootState, AppDispatch } from '../store';
import { createIncident } from '../store/slices/incidentSlice';
import { uploadService } from '../services/uploadService';
import { incidentService } from '../services/incidentService';
import { customColors, spacing } from '../utils/theme';

const ReportScreen: React.FC = ({ navigation, route }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isSubmitting } = useSelector((state: RootState) => state.incidents);
  const { currentLocation } = useSelector((state: RootState) => state.app);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const [location, setLocation] = useState(route?.params?.location || currentLocation);
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const incidentTypes = incidentService.getIncidentTypes();
  const severityLevels = incidentService.getSeverityLevels();

  useEffect(() => {
    if (!location && currentLocation) {
      setLocation(currentLocation);
    }
  }, [currentLocation]);

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select images',
      });
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets?.[0]) {
        setImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (error) {
      console.error('Camera error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take photo',
      });
    }
  };

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions to get current location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = addresses[0];
      const formattedAddress = address ? 
        `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim() :
        undefined;

      setLocation({
        latitude,
        longitude,
        address: formattedAddress,
      });

      Toast.show({
        type: 'success',
        text1: 'Location Updated',
        text2: 'Current location has been set',
      });
    } catch (error) {
      console.error('Location error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to get current location',
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Title is required' });
      return false;
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Description is required' });
      return false;
    }
    if (!type) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select incident type' });
      return false;
    }
    if (!severity) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select severity level' });
      return false;
    }
    if (!location) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Location is required' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsUploading(true);
      let uploadedImageUrls: string[] = [];

      // Upload images if any
      if (images.length > 0) {
        uploadedImageUrls = await uploadService.batchUploadWithRetry(
          images,
          'incident',
          3,
          (progress, completed, total) => {
            setUploadProgress(progress);
          }
        );
      }

      // Create incident
      const incidentData = {
        title: title.trim(),
        description: description.trim(),
        type,
        severity,
        location,
        images: uploadedImageUrls,
        tags: ['mobile_report'],
      };

      const result = await dispatch(createIncident(incidentData));

      if (createIncident.fulfilled.match(result)) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: 'Incident reported successfully',
        });

        // Reset form
        setTitle('');
        setDescription('');
        setType('');
        setSeverity('');
        setImages([]);
        setUploadProgress(0);

        // Navigate to incident detail
        navigation.navigate('IncidentDetail', { id: result.payload.id });
      } else {
        throw new Error(result.payload as string);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to submit report',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Report Incident</Text>
          <Text style={styles.sectionSubtitle}>
            Help protect mangroves by reporting environmental threats
          </Text>

          {/* Title */}
          <TextInput
            label="Incident Title *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="Brief description of the incident"
            maxLength={200}
          />

          {/* Description */}
          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Detailed description of what you observed"
            maxLength={2000}
          />

          {/* Incident Type */}
          <Text style={styles.fieldLabel}>Incident Type *</Text>
          <View style={styles.chipContainer}>
            {incidentTypes.map((incidentType) => (
              <Chip
                key={incidentType.value}
                selected={type === incidentType.value}
                onPress={() => setType(incidentType.value)}
                style={[
                  styles.chip,
                  type === incidentType.value && styles.selectedChip
                ]}
                icon={incidentType.icon}
              >
                {incidentType.label}
              </Chip>
            ))}
          </View>

          {/* Severity */}
          <Text style={styles.fieldLabel}>Severity Level *</Text>
          <View style={styles.chipContainer}>
            {severityLevels.map((level) => (
              <Chip
                key={level.value}
                selected={severity === level.value}
                onPress={() => setSeverity(level.value)}
                style={[
                  styles.chip,
                  severity === level.value && { backgroundColor: level.color }
                ]}
                textStyle={severity === level.value ? { color: '#FFFFFF' } : {}}
              >
                {level.label}
              </Chip>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.fieldLabel}>Location *</Text>
          <Surface style={styles.locationContainer} elevation={1}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <View style={styles.locationText}>
                {location ? (
                  <>
                    <Text style={styles.coordinates}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                    {location.address && (
                      <Text style={styles.address}>{location.address}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noLocation}>No location set</Text>
                )}
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={handleGetLocation}
              compact
              icon="crosshairs-gps"
            >
              Get Current
            </Button>
          </Surface>

          {/* Images */}
          <Text style={styles.fieldLabel}>Photos ({images.length}/5)</Text>
          <View style={styles.imageSection}>
            <View style={styles.imageButtons}>
              <Button
                mode="outlined"
                onPress={handleCamera}
                icon="camera"
                style={styles.imageButton}
              >
                Camera
              </Button>
              <Button
                mode="outlined"
                onPress={handleImagePicker}
                icon="image"
                style={styles.imageButton}
              >
                Gallery
              </Button>
            </View>

            {images.length > 0 && (
              <View style={styles.imagePreview}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} />
                    <Button
                      mode="contained"
                      onPress={() => removeImage(index)}
                      style={styles.removeButton}
                      contentStyle={styles.removeButtonContent}
                      icon="close"
                      compact
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Uploading images... {uploadProgress}%
              </Text>
              <ProgressBar progress={uploadProgress / 100} style={styles.progressBar} />
            </View>
          )}

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting || isUploading}
            disabled={isSubmitting || isUploading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon="send"
          >
            {isSubmitting || isUploading ? 'Submitting...' : 'Submit Report'}
          </Button>
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
  formCard: {
    margin: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: customColors.mangrove,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  selectedChip: {
    backgroundColor: customColors.mangrove,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  noLocation: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  imageSection: {
    marginBottom: spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  imageButton: {
    flex: 1,
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
  },
  removeButtonContent: {
    width: 24,
    height: 24,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: 14,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
});

export default ReportScreen;
