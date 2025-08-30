import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Chip, 
  Surface,
  ProgressBar,
  Avatar,
  Divider,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';
import { geminiValidationService, ValidationResult, ImageAnalysis } from '../../services/geminiValidationService';

interface AIValidationPanelProps {
  incident: {
    id: string;
    title: string;
    description: string;
    type: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    images?: string[];
  };
  onValidationComplete: (result: ValidationResult) => void;
  onAcceptValidation: (result: ValidationResult) => void;
  onRejectValidation: (reason: string) => void;
  visible: boolean;
}

const AIValidationPanel: React.FC<AIValidationPanelProps> = ({
  incident,
  onValidationComplete,
  onAcceptValidation,
  onRejectValidation,
  visible,
}) => {
  const theme = useTheme();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [imageAnalyses, setImageAnalyses] = useState<ImageAnalysis[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
    }
  }, [visible]);

  useEffect(() => {
    progressWidth.value = withTiming(analysisProgress / 100, { duration: 500 });
  }, [analysisProgress]);

  const startValidation = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep('Initializing AI analysis...');

    try {
      // Step 1: Analyze images if available
      let imageResults: ImageAnalysis[] = [];
      if (incident.images && incident.images.length > 0) {
        setCurrentStep('Analyzing incident images...');
        setAnalysisProgress(20);
        
        imageResults = await geminiValidationService.analyzeImages(incident.images);
        setImageAnalyses(imageResults);
        setAnalysisProgress(50);
      }

      // Step 2: Validate incident report
      setCurrentStep('Validating incident details...');
      setAnalysisProgress(70);

      const validation = await geminiValidationService.validateIncidentReport(
        incident.title,
        incident.description,
        incident.location,
        incident.type,
        imageResults.length > 0 ? imageResults : undefined
      );

      setAnalysisProgress(90);
      setCurrentStep('Finalizing analysis...');

      // Step 3: Complete validation
      setValidationResult(validation);
      setAnalysisProgress(100);
      setCurrentStep('Analysis complete!');
      
      onValidationComplete(validation);
    } catch (error) {
      console.error('AI validation failed:', error);
      setCurrentStep('Analysis failed - manual review required');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return customColors.success;
    if (confidence >= 0.6) return customColors.warning;
    return customColors.severityHigh;
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

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Card style={styles.validationCard}>
        <LinearGradient
          colors={['#E8F5E8', '#F0F8F0', '#FFFFFF']}
          style={styles.gradient}
        >
          <Card.Content>
            {/* Header */}
            <View style={styles.header}>
              <Avatar.Icon
                size={48}
                icon="brain"
                style={[styles.aiIcon, { backgroundColor: customColors.mangrove }]}
              />
              <View style={styles.headerText}>
                <Text style={styles.title}>🤖 AI Validation</Text>
                <Text style={styles.subtitle}>
                  Powered by Google Gemini
                </Text>
              </View>
            </View>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <View style={styles.progressSection}>
                <Text style={styles.progressText}>{currentStep}</Text>
                <View style={styles.progressContainer}>
                  <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
                </View>
                <Text style={styles.progressPercentage}>{analysisProgress}%</Text>
              </View>
            )}

            {/* Validation Results */}
            {validationResult && !isAnalyzing && (
              <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
                {/* Confidence Score */}
                <Surface style={styles.confidenceCard} elevation={2}>
                  <View style={styles.confidenceHeader}>
                    <Text style={styles.confidenceTitle}>Validation Confidence</Text>
                    <Text style={[
                      styles.confidenceScore,
                      { color: getConfidenceColor(validationResult.confidence) }
                    ]}>
                      {Math.round(validationResult.confidence * 100)}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={validationResult.confidence}
                    color={getConfidenceColor(validationResult.confidence)}
                    style={styles.confidenceProgress}
                  />
                </Surface>

                {/* Incident Classification */}
                <View style={styles.classificationSection}>
                  <Text style={styles.sectionTitle}>🏷️ Classification</Text>
                  <View style={styles.classificationChips}>
                    <Chip
                      icon="flag"
                      style={styles.typeChip}
                    >
                      {validationResult.incidentType.replace('_', ' ')}
                    </Chip>
                    <Chip
                      icon="alert"
                      style={[
                        styles.severityChip,
                        { backgroundColor: getSeverityColor(validationResult.severity) }
                      ]}
                      textStyle={{ color: '#FFFFFF' }}
                    >
                      {validationResult.severity.toUpperCase()}
                    </Chip>
                    <Chip
                      icon={validationResult.isValid ? "checkmark-circle" : "close-circle"}
                      style={[
                        styles.validityChip,
                        { backgroundColor: validationResult.isValid ? customColors.success : customColors.severityHigh }
                      ]}
                      textStyle={{ color: '#FFFFFF' }}
                    >
                      {validationResult.isValid ? 'VALID' : 'INVALID'}
                    </Chip>
                  </View>
                </View>

                {/* Environmental Analysis */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>🌿 Environmental Analysis</Text>
                  
                  <Surface style={styles.analysisCard} elevation={1}>
                    <View style={styles.analysisItem}>
                      <Ionicons 
                        name={validationResult.analysis.environmentalDamage.detected ? "alert-circle" : "checkmark-circle"} 
                        size={20} 
                        color={validationResult.analysis.environmentalDamage.detected ? customColors.severityHigh : customColors.success}
                      />
                      <View style={styles.analysisText}>
                        <Text style={styles.analysisLabel}>Environmental Damage</Text>
                        <Text style={styles.analysisValue}>
                          {validationResult.analysis.environmentalDamage.description}
                        </Text>
                      </View>
                    </View>

                    <Divider style={styles.analysisDivider} />

                    <View style={styles.analysisItem}>
                      <Ionicons 
                        name="water" 
                        size={20} 
                        color={customColors.info}
                      />
                      <View style={styles.analysisText}>
                        <Text style={styles.analysisLabel}>Mangrove Features</Text>
                        <Text style={styles.analysisValue}>
                          Trees: {validationResult.analysis.mangroveFeatures.treesVisible ? '✓' : '✗'} | 
                          Root damage: {validationResult.analysis.mangroveFeatures.rootSystemDamage ? '✓' : '✗'} | 
                          Water body: {validationResult.analysis.mangroveFeatures.waterBodyPresent ? '✓' : '✗'}
                        </Text>
                      </View>
                    </View>

                    <Divider style={styles.analysisDivider} />

                    <View style={styles.analysisItem}>
                      <Ionicons 
                        name="people" 
                        size={20} 
                        color={customColors.warning}
                      />
                      <View style={styles.analysisText}>
                        <Text style={styles.analysisLabel}>Human Activity</Text>
                        <Text style={styles.analysisValue}>
                          {validationResult.analysis.humanActivity.evidenceFound 
                            ? `Detected: ${validationResult.analysis.humanActivity.activityType.join(', ')}`
                            : 'No evidence found'
                          }
                        </Text>
                      </View>
                    </View>
                  </Surface>
                </View>

                {/* Urgency Factors */}
                {(validationResult.analysis.urgencyFactors.immediateAction || 
                  validationResult.analysis.urgencyFactors.spreadingRisk || 
                  validationResult.analysis.urgencyFactors.criticalHabitat) && (
                  <View style={styles.urgencySection}>
                    <Text style={styles.sectionTitle}>⚠️ Urgency Factors</Text>
                    <View style={styles.urgencyList}>
                      {validationResult.analysis.urgencyFactors.immediateAction && (
                        <Chip icon="flash" style={styles.urgencyChip}>
                          Immediate Action Required
                        </Chip>
                      )}
                      {validationResult.analysis.urgencyFactors.spreadingRisk && (
                        <Chip icon="trending-up" style={styles.urgencyChip}>
                          Spreading Risk
                        </Chip>
                      )}
                      {validationResult.analysis.urgencyFactors.criticalHabitat && (
                        <Chip icon="leaf" style={styles.urgencyChip}>
                          Critical Habitat
                        </Chip>
                      )}
                    </View>
                  </View>
                )}

                {/* Recommendations */}
                <View style={styles.recommendationsSection}>
                  <Text style={styles.sectionTitle}>💡 AI Recommendations</Text>
                  <View style={styles.recommendationsList}>
                    {validationResult.recommendations.map((recommendation, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Text style={styles.recommendationBullet}>•</Text>
                        <Text style={styles.recommendationText}>{recommendation}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Flagged Concerns */}
                {validationResult.flaggedConcerns.length > 0 && (
                  <View style={styles.concernsSection}>
                    <Text style={styles.sectionTitle}>🚩 Flagged Concerns</Text>
                    <View style={styles.concernsList}>
                      {validationResult.flaggedConcerns.map((concern, index) => (
                        <Surface key={index} style={styles.concernItem} elevation={1}>
                          <Ionicons name="warning" size={16} color={customColors.severityHigh} />
                          <Text style={styles.concernText}>{concern}</Text>
                        </Surface>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!validationResult && !isAnalyzing && (
                <Button
                  mode="contained"
                  onPress={startValidation}
                  icon="brain"
                  style={styles.analyzeButton}
                >
                  Start AI Analysis
                </Button>
              )}

              {validationResult && !isAnalyzing && (
                <>
                  <Button
                    mode="outlined"
                    onPress={() => onRejectValidation('AI validation rejected by user')}
                    icon="close"
                    style={styles.actionButton}
                  >
                    Reject
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => onAcceptValidation(validationResult)}
                    icon="checkmark"
                    style={styles.actionButton}
                  >
                    Accept AI Validation
                  </Button>
                </>
              )}
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  validationCard: {
    flex: 1,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  aiIcon: {
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: customColors.mangrove,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: customColors.mangrove,
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  resultsContainer: {
    maxHeight: 400,
    marginBottom: spacing.lg,
  },
  confidenceCard: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  confidenceScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  confidenceProgress: {
    height: 8,
  },
  classificationSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  classificationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    backgroundColor: customColors.info + '20',
  },
  severityChip: {
    // Color set dynamically
  },
  validityChip: {
    // Color set dynamically
  },
  analysisSection: {
    marginBottom: spacing.lg,
  },
  analysisCard: {
    padding: spacing.md,
    borderRadius: 8,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  analysisText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  analysisValue: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  analysisDivider: {
    marginVertical: spacing.sm,
  },
  urgencySection: {
    marginBottom: spacing.lg,
  },
  urgencyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  urgencyChip: {
    backgroundColor: customColors.severityHigh + '20',
  },
  recommendationsSection: {
    marginBottom: spacing.lg,
  },
  recommendationsList: {
    gap: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationBullet: {
    fontSize: 16,
    color: customColors.mangrove,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  concernsSection: {
    marginBottom: spacing.lg,
  },
  concernsList: {
    gap: spacing.sm,
  },
  concernItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: customColors.severityHigh + '10',
  },
  concernText: {
    fontSize: 12,
    marginLeft: spacing.sm,
    flex: 1,
    color: customColors.severityHigh,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  analyzeButton: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
});

export default AIValidationPanel;
