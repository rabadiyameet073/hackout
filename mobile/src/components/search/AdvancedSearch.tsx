import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Searchbar, 
  Card, 
  Chip, 
  Button,
  Surface,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { customColors, spacing } from '../../utils/theme';

interface SearchFilters {
  query: string;
  types: string[];
  severities: string[];
  statuses: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  location: {
    radius?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  validationScore: {
    min: number;
    max: number;
  };
  sortBy: 'date' | 'severity' | 'validation' | 'distance';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  initialFilters?: Partial<SearchFilters>;
  recentSearches?: string[];
  suggestions?: string[];
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClearFilters,
  initialFilters = {},
  recentSearches = [],
  suggestions = [],
}) => {
  const theme = useTheme();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    types: [],
    severities: [],
    statuses: [],
    dateRange: {},
    location: {},
    validationScore: { min: 0, max: 5 },
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const advancedHeight = useSharedValue(0);
  const suggestionsOpacity = useSharedValue(0);

  useEffect(() => {
    advancedHeight.value = withTiming(showAdvanced ? 400 : 0, { duration: 300 });
  }, [showAdvanced]);

  useEffect(() => {
    suggestionsOpacity.value = withTiming(showSuggestions ? 1 : 0, { duration: 200 });
  }, [showSuggestions]);

  const incidentTypes = [
    { value: 'illegal_cutting', label: 'Illegal Cutting', icon: 'cut' },
    { value: 'pollution', label: 'Pollution', icon: 'warning' },
    { value: 'land_reclamation', label: 'Land Reclamation', icon: 'construct' },
    { value: 'wildlife_disturbance', label: 'Wildlife Disturbance', icon: 'paw' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: customColors.severityLow },
    { value: 'medium', label: 'Medium', color: customColors.severityMedium },
    { value: 'high', label: 'High', color: customColors.severityHigh },
    { value: 'critical', label: 'Critical', color: customColors.severityCritical },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'verified', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const handleSearch = () => {
    onSearch(filters);
    setShowSuggestions(false);
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      types: [],
      severities: [],
      statuses: [],
      dateRange: {},
      location: {},
      validationScore: { min: 0, max: 5 },
      sortBy: 'date',
      sortOrder: 'desc',
    });
    onClearFilters();
  };

  const toggleFilter = (category: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const currentArray = prev[category] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return { ...prev, [category]: newArray };
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate && showDatePicker) {
      setFilters(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [showDatePicker]: selectedDate,
        },
      }));
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.types.length > 0) count++;
    if (filters.severities.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.location.radius) count++;
    if (filters.validationScore.min > 0 || filters.validationScore.max < 5) count++;
    return count;
  };

  const animatedAdvancedStyle = useAnimatedStyle(() => ({
    height: advancedHeight.value,
    opacity: advancedHeight.value / 400,
  }));

  const animatedSuggestionsStyle = useAnimatedStyle(() => ({
    opacity: suggestionsOpacity.value,
  }));

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(filters.query.toLowerCase()) && 
    suggestion !== filters.query
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Surface style={styles.searchContainer} elevation={2}>
        <Searchbar
          placeholder="Search incidents, locations, or keywords..."
          onChangeText={(query) => {
            setFilters(prev => ({ ...prev, query }));
            setShowSuggestions(query.length > 0 && (filteredSuggestions.length > 0 || recentSearches.length > 0));
          }}
          value={filters.query}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
          icon="magnify"
          clearIcon="close"
          onClearIconPress={() => {
            setFilters(prev => ({ ...prev, query: '' }));
            setShowSuggestions(false);
          }}
        />

        <View style={styles.searchActions}>
          <Button
            mode={showAdvanced ? 'contained' : 'outlined'}
            onPress={() => setShowAdvanced(!showAdvanced)}
            icon="tune"
            compact
            style={styles.filterButton}
          >
            Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSearch}
            icon="magnify"
            compact
            style={styles.searchButton}
          >
            Search
          </Button>
        </View>
      </Surface>

      {/* Search Suggestions */}
      {showSuggestions && (
        <Animated.View style={[styles.suggestionsContainer, animatedSuggestionsStyle]}>
          <Surface style={styles.suggestions} elevation={4}>
            {recentSearches.length > 0 && filters.query.length === 0 && (
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionSectionTitle}>Recent Searches</Text>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <Button
                    key={index}
                    mode="text"
                    onPress={() => {
                      setFilters(prev => ({ ...prev, query: search }));
                      setShowSuggestions(false);
                    }}
                    icon="history"
                    style={styles.suggestionItem}
                    contentStyle={styles.suggestionContent}
                  >
                    {search}
                  </Button>
                ))}
              </View>
            )}

            {filteredSuggestions.length > 0 && (
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionSectionTitle}>Suggestions</Text>
                {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                  <Button
                    key={index}
                    mode="text"
                    onPress={() => {
                      setFilters(prev => ({ ...prev, query: suggestion }));
                      setShowSuggestions(false);
                    }}
                    icon="magnify"
                    style={styles.suggestionItem}
                    contentStyle={styles.suggestionContent}
                  >
                    {suggestion}
                  </Button>
                ))}
              </View>
            )}
          </Surface>
        </Animated.View>
      )}

      {/* Advanced Filters */}
      <Animated.View style={[styles.advancedContainer, animatedAdvancedStyle]}>
        <ScrollView style={styles.advancedScroll} showsVerticalScrollIndicator={false}>
          <Card style={styles.filterCard}>
            <Card.Content>
              {/* Incident Types */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Incident Types</Text>
                <View style={styles.chipContainer}>
                  {incidentTypes.map((type) => (
                    <Chip
                      key={type.value}
                      selected={filters.types.includes(type.value)}
                      onPress={() => toggleFilter('types', type.value)}
                      icon={type.icon}
                      style={styles.filterChip}
                    >
                      {type.label}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Severity Levels */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Severity Levels</Text>
                <View style={styles.chipContainer}>
                  {severityLevels.map((severity) => (
                    <Chip
                      key={severity.value}
                      selected={filters.severities.includes(severity.value)}
                      onPress={() => toggleFilter('severities', severity.value)}
                      style={[
                        styles.filterChip,
                        filters.severities.includes(severity.value) && {
                          backgroundColor: severity.color,
                        }
                      ]}
                      textStyle={
                        filters.severities.includes(severity.value) 
                          ? { color: '#FFFFFF' } 
                          : undefined
                      }
                    >
                      {severity.label}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Status</Text>
                <View style={styles.chipContainer}>
                  {statusOptions.map((status) => (
                    <Chip
                      key={status.value}
                      selected={filters.statuses.includes(status.value)}
                      onPress={() => toggleFilter('statuses', status.value)}
                      style={styles.filterChip}
                    >
                      {status.label}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Date Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Date Range</Text>
                <View style={styles.dateContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker('start')}
                    icon="calendar"
                    style={styles.dateButton}
                  >
                    {filters.dateRange.start 
                      ? filters.dateRange.start.toLocaleDateString()
                      : 'Start Date'
                    }
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker('end')}
                    icon="calendar"
                    style={styles.dateButton}
                  >
                    {filters.dateRange.end 
                      ? filters.dateRange.end.toLocaleDateString()
                      : 'End Date'
                    }
                  </Button>
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Sort By</Text>
                <SegmentedButtons
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                  buttons={[
                    { value: 'date', label: 'Date' },
                    { value: 'severity', label: 'Severity' },
                    { value: 'validation', label: 'Score' },
                  ]}
                  style={styles.segmentedButtons}
                />
                
                <SegmentedButtons
                  value={filters.sortOrder}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as any }))}
                  buttons={[
                    { value: 'desc', label: 'Newest First' },
                    { value: 'asc', label: 'Oldest First' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={handleClearFilters}
                  icon="close"
                  style={styles.actionButton}
                >
                  Clear All
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSearch}
                  icon="magnify"
                  style={styles.actionButton}
                >
                  Apply Filters
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </Animated.View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker === 'start' 
              ? filters.dateRange.start || new Date()
              : filters.dateRange.end || new Date()
          }
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  searchbar: {
    marginBottom: spacing.md,
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  searchActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
  },
  searchButton: {
    flex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 120,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  suggestions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: 300,
  },
  suggestionSection: {
    padding: spacing.md,
  },
  suggestionSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: '#666',
  },
  suggestionItem: {
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  suggestionContent: {
    justifyContent: 'flex-start',
  },
  advancedContainer: {
    overflow: 'hidden',
  },
  advancedScroll: {
    flex: 1,
  },
  filterCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: customColors.mangrove,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginBottom: spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
  },
  segmentedButtons: {
    marginBottom: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});

export default AdvancedSearch;
