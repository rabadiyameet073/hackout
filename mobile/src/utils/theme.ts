import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',
    primaryContainer: '#A8DAB5',
    secondary: '#4CAF50',
    secondaryContainer: '#C8E6C9',
    tertiary: '#FF5722',
    tertiaryContainer: '#FFCCBC',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#D32F2F',
    errorContainer: '#FFCDD2',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1B5E20',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#2E7D32',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#BF360C',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    onBackground: '#1C1B1F',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#A8DAB5',
    elevation: {
      level0: 'transparent',
      level1: '#F7F2FA',
      level2: '#F1EDF7',
      level3: '#ECE6F0',
      level4: '#EAE7F0',
      level5: '#E6E0E9',
    },
    surfaceDisabled: '#E6E1E5',
    onSurfaceDisabled: '#C7C5CA',
    backdrop: '#4F4A5A',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A8DAB5',
    primaryContainer: '#1B5E20',
    secondary: '#81C784',
    secondaryContainer: '#2E7D32',
    tertiary: '#FF8A65',
    tertiaryContainer: '#BF360C',
    surface: '#1C1B1F',
    surfaceVariant: '#49454F',
    background: '#141218',
    error: '#F2B8B5',
    errorContainer: '#8C1D18',
    onPrimary: '#1B5E20',
    onPrimaryContainer: '#A8DAB5',
    onSecondary: '#2E7D32',
    onSecondaryContainer: '#C8E6C9',
    onTertiary: '#BF360C',
    onTertiaryContainer: '#FFCCBC',
    onSurface: '#E6E1E5',
    onSurfaceVariant: '#CAC4D0',
    onBackground: '#E6E1E5',
    onError: '#601410',
    onErrorContainer: '#F2B8B5',
    outline: '#938F99',
    outlineVariant: '#49454F',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#E6E1E5',
    inverseOnSurface: '#313033',
    inversePrimary: '#2E7D32',
    elevation: {
      level0: 'transparent',
      level1: '#22212A',
      level2: '#28272F',
      level3: '#2E2D36',
      level4: '#2F2E37',
      level5: '#33323B',
    },
    surfaceDisabled: '#1F1A24',
    onSurfaceDisabled: '#4F4A5A',
    backdrop: '#4F4A5A',
  },
};

export const theme = lightTheme;
export const darkTheme = darkTheme;

// Custom theme extensions
export const customColors = {
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  mangrove: '#2E7D32',
  water: '#1976D2',
  earth: '#8D6E63',
  wildlife: '#FF5722',
  pollution: '#9C27B0',
  
  // Severity colors
  severityLow: '#4CAF50',
  severityMedium: '#FF9800',
  severityHigh: '#F44336',
  severityCritical: '#9C27B0',
  
  // Status colors
  statusPending: '#FF9800',
  statusUnderReview: '#2196F3',
  statusVerified: '#4CAF50',
  statusRejected: '#F44336',
  statusResolved: '#9E9E9E',
  
  // Gamification colors
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

export const animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    linear: 'linear',
  },
};
