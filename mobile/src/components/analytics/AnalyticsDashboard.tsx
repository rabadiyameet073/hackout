import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Surface, 
  SegmentedButtons,
  useTheme 
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');
const chartWidth = width - (spacing.md * 4);

interface AnalyticsData {
  incidentTrends: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }>;
  };
  severityDistribution: Array<{
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }>;
  typeBreakdown: {
    labels: string[];
    datasets: Array<{
      data: number[];
    }>;
  };
  impactMetrics: {
    totalReports: number;
    verifiedIncidents: number;
    areaProtected: number;
    communityMembers: number;
    responseTime: number;
    resolutionRate: number;
  };
  regionalData: Array<{
    region: string;
    incidents: number;
    severity: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
}) => {
  const theme = useTheme();
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withTiming(0, { duration: 800 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: customColors.mangrove,
    },
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'trending-flat';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return customColors.severityHigh;
      case 'down': return customColors.success;
      case 'stable': return customColors.warning;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderMetricCard = (
    title: string,
    value: number | string,
    icon: string,
    color: string,
    subtitle?: string,
    trend?: number
  ) => (
    <Card style={styles.metricCard}>
      <Card.Content style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          {trend !== undefined && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'trending-flat'} 
                size={16} 
                color={trend > 0 ? customColors.success : trend < 0 ? customColors.severityHigh : customColors.warning}
              />
              <Text style={[
                styles.trendText,
                { color: trend > 0 ? customColors.success : trend < 0 ? customColors.severityHigh : customColors.warning }
              ]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.metricValue}>{typeof value === 'number' ? formatNumber(value) : value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={animatedStyle}>
        {/* Header */}
        <Surface style={styles.header} elevation={2}>
          <Text style={styles.headerTitle}>📊 Impact Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Track conservation progress and community impact
          </Text>
        </Surface>

        {/* Time Range Selector */}
        <Card style={styles.timeRangeCard}>
          <Card.Content>
            <SegmentedButtons
              value={timeRange}
              onValueChange={onTimeRangeChange}
              buttons={[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'quarter', label: 'Quarter' },
                { value: 'year', label: 'Year' },
              ]}
            />
          </Card.Content>
        </Card>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Reports',
            data.impactMetrics.totalReports,
            'flag',
            customColors.mangrove,
            'Community submissions',
            12
          )}
          {renderMetricCard(
            'Verified Incidents',
            data.impactMetrics.verifiedIncidents,
            'checkmark-circle',
            customColors.success,
            'Expert validated',
            8
          )}
          {renderMetricCard(
            'Area Protected',
            `${data.impactMetrics.areaProtected} ha`,
            'leaf',
            customColors.info,
            'Mangrove coverage',
            -3
          )}
          {renderMetricCard(
            'Community Members',
            data.impactMetrics.communityMembers,
            'people',
            customColors.warning,
            'Active contributors',
            25
          )}
        </View>

        {/* Incident Trends Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Incident Trends</Text>
            <Text style={styles.chartSubtitle}>Reports over time</Text>
            <LineChart
              data={data.incidentTrends}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withDots={true}
              withShadow={false}
              withInnerLines={false}
              withOuterLines={true}
            />
          </Card.Content>
        </Card>

        {/* Severity Distribution */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Severity Distribution</Text>
            <Text style={styles.chartSubtitle}>Incident severity breakdown</Text>
            <PieChart
              data={data.severityDistribution}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute
            />
          </Card.Content>
        </Card>

        {/* Incident Types */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Incident Types</Text>
            <Text style={styles.chartSubtitle}>Most common threats</Text>
            <BarChart
              data={data.typeBreakdown}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              style={styles.chart}
              showValuesOnTopOfBars={true}
            />
          </Card.Content>
        </Card>

        {/* Regional Analysis */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Regional Analysis</Text>
            <Text style={styles.chartSubtitle}>Incidents by region</Text>
            <View style={styles.regionalList}>
              {data.regionalData.map((region, index) => (
                <Animated.View
                  key={region.region}
                  style={[
                    styles.regionalItem,
                    {
                      opacity: withDelay(index * 100, withTiming(1, { duration: 500 })),
                    },
                  ]}
                >
                  <View style={styles.regionalInfo}>
                    <Text style={styles.regionalName}>{region.region}</Text>
                    <Text style={styles.regionalIncidents}>
                      {region.incidents} incidents
                    </Text>
                  </View>
                  <View style={styles.regionalMetrics}>
                    <View style={styles.severityIndicator}>
                      <View
                        style={[
                          styles.severityBar,
                          {
                            width: `${region.severity * 20}%`,
                            backgroundColor: 
                              region.severity >= 4 ? customColors.severityCritical :
                              region.severity >= 3 ? customColors.severityHigh :
                              region.severity >= 2 ? customColors.severityMedium :
                              customColors.severityLow,
                          },
                        ]}
                      />
                    </View>
                    <Ionicons
                      name={getTrendIcon(region.trend)}
                      size={20}
                      color={getTrendColor(region.trend)}
                    />
                  </View>
                </Animated.View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Performance Metrics */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Performance Metrics</Text>
            <Text style={styles.chartSubtitle}>System efficiency indicators</Text>
            
            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>
                  {data.impactMetrics.responseTime}h
                </Text>
                <Text style={styles.performanceLabel}>Avg Response Time</Text>
                <View style={styles.performanceBar}>
                  <View
                    style={[
                      styles.performanceBarFill,
                      {
                        width: `${Math.min((24 - data.impactMetrics.responseTime) / 24 * 100, 100)}%`,
                        backgroundColor: data.impactMetrics.responseTime <= 6 ? customColors.success : 
                                       data.impactMetrics.responseTime <= 12 ? customColors.warning : 
                                       customColors.severityHigh,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>
                  {data.impactMetrics.resolutionRate}%
                </Text>
                <Text style={styles.performanceLabel}>Resolution Rate</Text>
                <View style={styles.performanceBar}>
                  <View
                    style={[
                      styles.performanceBarFill,
                      {
                        width: `${data.impactMetrics.resolutionRate}%`,
                        backgroundColor: data.impactMetrics.resolutionRate >= 80 ? customColors.success : 
                                       data.impactMetrics.resolutionRate >= 60 ? customColors.warning : 
                                       customColors.severityHigh,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>🔍 Key Insights</Text>
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={16} color={customColors.success} />
                <Text style={styles.insightText}>
                  Community engagement increased by 25% this month
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="alert-circle" size={16} color={customColors.warning} />
                <Text style={styles.insightText}>
                  Illegal cutting incidents peaked in coastal areas
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="checkmark-circle" size={16} color={customColors.success} />
                <Text style={styles.insightText}>
                  Response time improved by 15% with mobile reporting
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.mangrove,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timeRangeCard: {
    margin: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  metricCard: {
    width: (width - spacing.md * 3) / 2,
    marginBottom: spacing.sm,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.sm,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: customColors.mangrove,
    marginBottom: spacing.xs,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  chartCard: {
    margin: spacing.md,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.lg,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  regionalList: {
    gap: spacing.md,
  },
  regionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  regionalInfo: {
    flex: 1,
  },
  regionalName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  regionalIncidents: {
    fontSize: 12,
    color: '#666',
  },
  regionalMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  severityIndicator: {
    width: 60,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  severityBar: {
    height: '100%',
    borderRadius: 2,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: customColors.mangrove,
    marginBottom: spacing.xs,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  performanceBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightsCard: {
    margin: spacing.md,
    marginBottom: spacing.xl,
  },
  insightsList: {
    gap: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  insightText: {
    fontSize: 14,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
});

export default AnalyticsDashboard;
