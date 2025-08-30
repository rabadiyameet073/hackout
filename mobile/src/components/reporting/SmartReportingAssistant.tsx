import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Chip, 
  Surface,
  ProgressBar,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';

interface AIAnalysis {
  confidence: number;
  suggestedType: string;
  suggestedSeverity: string;
  detectedFeatures: string[];
  recommendations: string[];
  environmentalFactors: string[];
}

interface SmartReportingAssistantProps {
  images: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onAnalysisComplete: (analysis: AIAnalysis) => void;
  onSuggestionApply: (field: string, value: string) => void;
}

const SmartReportingAssistant: React.FC<SmartReportingAssistantProps> = ({
  images,
  location,
  onAnalysisComplete,
  onSuggestionApply,
}) => {
  const theme = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (images.length > 0) {
      performAnalysis();
    }
  }, [images]);

  useEffect(() => {
    if (analysis) {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, { damping: 15 });
    }
  }, [analysis]);

  const performAnalysis = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate AI analysis with progress updates
      const steps = [
        { progress: 20, message: 'Processing images...' },
        { progress: 40, message: 'Detecting environmental features...' },
        { progress: 60, message: 'Analyzing threat patterns...' },
        { progress: 80, message: 'Generating recommendations...' },
        { progress: 100, message: 'Analysis complete!' },
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(step.progress);
      }

      // Mock AI analysis results
      const mockAnalysis: AIAnalysis = {
        confidence: 0.85,
        suggestedType: 'illegal_cutting',
        suggestedSeverity: 'high',
        detectedFeatures: [
          'Cut mangrove stumps visible',
          'Fresh sawdust on ground',
          'Disturbed soil patterns',
          'Missing canopy coverage'
        ],
        recommendations: [
          'Document all visible cut stumps',
          'Include wide-angle shots for context',
          'Note any equipment or vehicles nearby',
          'Record approximate number of affected trees'
        ],
        environmentalFactors: [
          'Tidal zone location',
          'High biodiversity area',
          'Critical habitat for migratory birds',
          'Coastal protection zone'
        ]
      };

      setAnalysis(mockAnalysis);
      onAnalysisComplete(mockAnalysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return customColors.success;
    if (confidence >= 0.6) return customColors.warning;
    return customColors.severityHigh;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'illegal_cutting': return 'cut';
      case 'pollution': return 'warning';
      case 'land_reclamation': return 'construct';
      case 'wildlife_disturbance': return 'paw';
      default: return 'alert-circle';
    }
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

  if (images.length === 0) {
    return (
      <Card style={styles.container}>
        <Card.Content style={styles.emptyContent}>
          <Ionicons name="camera" size={48} color="#CCC" />
          <Text style={styles.emptyText}>
            Add photos to get AI-powered analysis and suggestions
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card style={styles.container}>
        <Card.Content style={styles.analyzingContent}>
          <View style={styles.analyzingHeader}>
            <Ionicons name="brain" size={32} color={customColors.mangrove} />
            <Text style={styles.analyzingTitle}>AI Analysis in Progress</Text>
          </View>
          
          <ProgressBar 
            progress={analysisProgress / 100} 
            style={styles.progressBar}
            color={customColors.mangrove}
          />
          
          <Text style={styles.progressText}>
            {analysisProgress}% complete
          </Text>
          
          <View style={styles.imagePreview}>
            {images.slice(0, 3).map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.previewImage} />
            ))}
            {images.length > 3 && (
              <View style={styles.moreImages}>
                <Text style={styles.moreImagesText}>+{images.length - 3}</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Animated.View style={animatedStyle}>
      <Card style={styles.container}>
        <Card.Content>
          <View style={styles.header}>
            <Ionicons name="sparkles" size={24} color={customColors.mangrove} />
            <Text style={styles.title}>AI Analysis Results</Text>
            <View style={styles.confidenceBadge}>
              <Text style={[styles.confidenceText, { color: getConfidenceColor(analysis.confidence) }]}>
                {Math.round(analysis.confidence * 100)}% confident
              </Text>
            </View>
          </View>

          {/* Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Suggestions</Text>
            
            <View style={styles.suggestionRow}>
              <Text style={styles.suggestionLabel}>Incident Type:</Text>
              <View style={styles.suggestionValue}>
                <Chip
                  icon={getTypeIcon(analysis.suggestedType)}
                  style={styles.suggestionChip}
                >
                  {analysis.suggestedType.replace('_', ' ')}
                </Chip>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => onSuggestionApply('type', analysis.suggestedType)}
                  style={styles.applyButton}
                >
                  Apply
                </Button>
              </View>
            </View>

            <View style={styles.suggestionRow}>
              <Text style={styles.suggestionLabel}>Severity:</Text>
              <View style={styles.suggestionValue}>
                <Chip
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: getSeverityColor(analysis.suggestedSeverity) }
                  ]}
                  textStyle={{ color: '#FFFFFF' }}
                >
                  {analysis.suggestedSeverity.toUpperCase()}
                </Chip>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => onSuggestionApply('severity', analysis.suggestedSeverity)}
                  style={styles.applyButton}
                >
                  Apply
                </Button>
              </View>
            </View>
          </View>

          {/* Detected Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Features</Text>
            <View style={styles.featuresList}>
              {analysis.detectedFeatures.map((feature, index) => (
                <Surface key={index} style={styles.featureItem} elevation={1}>
                  <Ionicons name="checkmark-circle" size={16} color={customColors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </Surface>
              ))}
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <View style={styles.recommendationsList}>
              {analysis.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>•</Text>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Environmental Context */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environmental Context</Text>
            <View style={styles.contextList}>
              {analysis.environmentalFactors.map((factor, index) => (
                <Chip key={index} style={styles.contextChip} icon="leaf">
                  {factor}
                </Chip>
              ))}
            </View>
          </View>

          <Button
            mode="outlined"
            onPress={performAnalysis}
            icon="refresh"
            style={styles.reanalyzeButton}
          >
            Re-analyze Images
          </Button>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    marginTop: 0,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  analyzingContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  analyzingHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  analyzingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    color: customColors.mangrove,
  },
  progressBar: {
    width: '100%',
    height: 6,
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: spacing.lg,
  },
  imagePreview: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  moreImages: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: customColors.mangrove,
  },
  suggestionRow: {
    marginBottom: spacing.md,
  },
  suggestionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: spacing.xs,
  },
  suggestionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionChip: {
    flex: 1,
    marginRight: spacing.sm,
  },
  applyButton: {
    borderColor: customColors.mangrove,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    marginLeft: spacing.sm,
    flex: 1,
  },
  recommendationsList: {
    gap: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationBullet: {
    fontSize: 14,
    color: customColors.mangrove,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
  contextList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contextChip: {
    backgroundColor: customColors.mangrove + '20',
  },
  reanalyzeButton: {
    marginTop: spacing.md,
    borderColor: customColors.mangrove,
  },
});

export default SmartReportingAssistant;
