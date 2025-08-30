import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../utils/theme';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  showLogo = true 
}) => {
  return (
    <LinearGradient
      colors={[customColors.mangrove, '#1B5E20']}
      style={styles.container}
    >
      <View style={styles.content}>
        {showLogo && (
          <View style={styles.logoContainer}>
            <Surface style={styles.logoSurface} elevation={4}>
              <Text style={styles.logoText}>🌿</Text>
            </Surface>
            <Text style={styles.appName}>Mangrove Watch</Text>
            <Text style={styles.tagline}>Protecting Our Coastal Forests</Text>
          </View>
        )}
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color="#FFFFFF" 
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 2,
  },
  logoSurface: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 16,
    color: '#A8DAB5',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default LoadingScreen;
