import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { 
  Text, 
  Surface, 
  IconButton, 
  Button,
  Chip,
  useTheme 
} from 'react-native-paper';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface SmartCameraProps {
  onPhotoTaken: (photoUri: string, analysis?: CameraAnalysis) => void;
  onClose: () => void;
  enableAIAnalysis?: boolean;
  maxPhotos?: number;
  currentPhotoCount?: number;
}

interface CameraAnalysis {
  confidence: number;
  detectedObjects: string[];
  suggestedType: string;
  suggestedSeverity: string;
  environmentalFactors: string[];
  recommendations: string[];
}

const SmartCamera: React.FC<SmartCameraProps> = ({
  onPhotoTaken,
  onClose,
  enableAIAnalysis = true,
  maxPhotos = 5,
  currentPhotoCount = 0,
}) => {
  const theme = useTheme();
  const cameraRef = useRef<Camera>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(FlashMode.auto);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CameraAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureScale = useSharedValue(1);
  const analysisOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  useEffect(() => {
    if (showAnalysis) {
      analysisOpacity.value = withTiming(1, { duration: 300 });
    } else {
      analysisOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [showAnalysis]);

  const performAIAnalysis = async (imageUri: string): Promise<CameraAnalysis> => {
    // Simulate AI analysis - in real app, this would call your AI service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis results
    const mockAnalysis: CameraAnalysis = {
      confidence: 0.87,
      detectedObjects: [
        'Mangrove trees',
        'Cut stumps',
        'Disturbed soil',
        'Water body'
      ],
      suggestedType: 'illegal_cutting',
      suggestedSeverity: 'high',
      environmentalFactors: [
        'Tidal zone',
        'High biodiversity area',
        'Critical habitat'
      ],
      recommendations: [
        'Document all visible damage',
        'Include wide-angle context shots',
        'Note any equipment nearby',
        'Record GPS coordinates'
      ]
    };

    return mockAnalysis;
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    if (currentPhotoCount >= maxPhotos) {
      Alert.alert('Photo Limit', `Maximum ${maxPhotos} photos allowed per report.`);
      return;
    }

    setIsCapturing(true);
    
    // Animate capture button
    captureScale.value = withSpring(0.8, {}, () => {
      captureScale.value = withSpring(1);
    });

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      // Compress and optimize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      let analysis: CameraAnalysis | undefined;

      if (enableAIAnalysis) {
        setIsAnalyzing(true);
        setShowAnalysis(true);
        
        try {
          analysis = await performAIAnalysis(manipulatedImage.uri);
          setAnalysisResult(analysis);
        } catch (error) {
          console.error('AI Analysis failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }

      // Save to device gallery
      await MediaLibrary.saveToLibraryAsync(manipulatedImage.uri);

      onPhotoTaken(manipulatedImage.uri, analysis);
      
      if (!enableAIAnalysis) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case FlashMode.auto: return FlashMode.on;
        case FlashMode.on: return FlashMode.off;
        case FlashMode.off: return FlashMode.auto;
        default: return FlashMode.auto;
      }
    });
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case FlashMode.on: return 'flash';
      case FlashMode.off: return 'flash-off';
      case FlashMode.auto: return 'flash-auto';
      default: return 'flash-auto';
    }
  };

  const handleAcceptAnalysis = () => {
    setShowAnalysis(false);
    onClose();
  };

  const handleRetakePhoto = () => {
    setShowAnalysis(false);
    setAnalysisResult(null);
  };

  const animatedCaptureStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const animatedAnalysisStyle = useAnimatedStyle(() => ({
    opacity: analysisOpacity.value,
  }));

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color="#CCC" />
        <Text style={styles.permissionText}>Camera permission denied</Text>
        <Button mode="contained" onPress={onClose}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        ratio="16:9"
      >
        {/* Camera Overlay */}
        <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
          {/* Top Controls */}
          <Surface style={styles.topControls} elevation={2}>
            <IconButton
              icon="close"
              onPress={onClose}
              iconColor="#FFFFFF"
              style={styles.controlButton}
            />
            
            <View style={styles.topCenter}>
              <Chip style={styles.photoCounter} textStyle={styles.photoCounterText}>
                {currentPhotoCount}/{maxPhotos} photos
              </Chip>
              {enableAIAnalysis && (
                <Chip 
                  icon="brain" 
                  style={styles.aiChip} 
                  textStyle={styles.aiChipText}
                >
                  AI Analysis
                </Chip>
              )}
            </View>

            <View style={styles.topRight}>
              <IconButton
                icon={getFlashIcon()}
                onPress={toggleFlash}
                iconColor="#FFFFFF"
                style={styles.controlButton}
              />
              <IconButton
                icon="camera-flip"
                onPress={toggleCameraType}
                iconColor="#FFFFFF"
                style={styles.controlButton}
              />
            </View>
          </Surface>

          {/* Camera Guidelines */}
          <View style={styles.guidelines}>
            <View style={styles.guideline} />
            <View style={[styles.guideline, styles.guidelineHorizontal]} />
          </View>

          {/* Focus Area */}
          <View style={styles.focusArea}>
            <View style={styles.focusCorner} />
            <View style={[styles.focusCorner, styles.focusCornerTopRight]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomLeft]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomRight]} />
          </View>

          {/* Bottom Controls */}
          <Surface style={styles.bottomControls} elevation={2}>
            <View style={styles.captureContainer}>
              <Text style={styles.captureHint}>
                {enableAIAnalysis 
                  ? "AI will analyze your photo for incident details"
                  : "Tap to capture photo"
                }
              </Text>
              
              <Animated.View style={animatedCaptureStyle}>
                <IconButton
                  icon="camera"
                  size={40}
                  onPress={takePicture}
                  disabled={isCapturing}
                  style={[
                    styles.captureButton,
                    isCapturing && styles.capturingButton
                  ]}
                  iconColor="#FFFFFF"
                />
              </Animated.View>

              <Text style={styles.captureSubhint}>
                Hold steady for best results
              </Text>
            </View>
          </Surface>
        </Animated.View>

        {/* AI Analysis Overlay */}
        {showAnalysis && (
          <Animated.View style={[styles.analysisOverlay, animatedAnalysisStyle]}>
            <Surface style={styles.analysisCard} elevation={4}>
              <View style={styles.analysisHeader}>
                <Ionicons name="brain" size={24} color={customColors.mangrove} />
                <Text style={styles.analysisTitle}>
                  {isAnalyzing ? 'Analyzing Photo...' : 'Analysis Complete'}
                </Text>
              </View>

              {isAnalyzing ? (
                <View style={styles.analyzingContent}>
                  <Text style={styles.analyzingText}>
                    AI is examining your photo for environmental threats...
                  </Text>
                </View>
              ) : analysisResult && (
                <View style={styles.analysisContent}>
                  <View style={styles.confidenceSection}>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <Text style={styles.confidenceValue}>
                      {Math.round(analysisResult.confidence * 100)}%
                    </Text>
                  </View>

                  <View style={styles.detectionSection}>
                    <Text style={styles.detectionTitle}>Detected:</Text>
                    {analysisResult.detectedObjects.slice(0, 3).map((object, index) => (
                      <Chip key={index} style={styles.detectionChip}>
                        {object}
                      </Chip>
                    ))}
                  </View>

                  <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionTitle}>Suggestions:</Text>
                    <Chip 
                      style={[styles.suggestionChip, { backgroundColor: customColors.warning }]}
                      textStyle={{ color: '#FFFFFF' }}
                    >
                      {analysisResult.suggestedType.replace('_', ' ')}
                    </Chip>
                    <Chip 
                      style={[styles.suggestionChip, { backgroundColor: customColors.severityHigh }]}
                      textStyle={{ color: '#FFFFFF' }}
                    >
                      {analysisResult.suggestedSeverity} severity
                    </Chip>
                  </View>

                  <View style={styles.analysisActions}>
                    <Button
                      mode="outlined"
                      onPress={handleRetakePhoto}
                      icon="camera"
                      style={styles.analysisButton}
                    >
                      Retake
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleAcceptAnalysis}
                      icon="check"
                      style={styles.analysisButton}
                    >
                      Use Photo
                    </Button>
                  </View>
                </View>
              )}
            </Surface>
          </Animated.View>
        )}
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topCenter: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  topRight: {
    flexDirection: 'row',
  },
  photoCounter: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  aiChip: {
    backgroundColor: customColors.mangrove + '80',
  },
  aiChipText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  guidelines: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    right: '25%',
    bottom: '40%',
  },
  guideline: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  guidelineHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
  },
  focusArea: {
    position: 'absolute',
    top: '35%',
    left: '20%',
    right: '20%',
    bottom: '35%',
  },
  focusCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
    borderWidth: 2,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  focusCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },
  focusCornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 2,
  },
  focusCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  bottomControls: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: spacing.lg,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureHint: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  captureButton: {
    backgroundColor: customColors.mangrove,
    width: 80,
    height: 80,
    borderRadius: 40,
    marginVertical: spacing.sm,
  },
  capturingButton: {
    backgroundColor: customColors.mangrove + '80',
  },
  captureSubhint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisCard: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    borderRadius: 16,
    padding: spacing.lg,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  analyzingContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  analyzingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  analysisContent: {
    gap: spacing.lg,
  },
  confidenceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: customColors.success,
  },
  detectionSection: {
    gap: spacing.sm,
  },
  detectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  detectionChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  suggestionSection: {
    gap: spacing.sm,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  suggestionChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  analysisActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  analysisButton: {
    flex: 1,
  },
});

export default SmartCamera;
