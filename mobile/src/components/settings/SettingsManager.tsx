import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  List, 
  Switch, 
  Button, 
  Card,
  Divider,
  Surface,
  SegmentedButtons,
  Slider,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

import { customColors, spacing } from '../../utils/theme';

interface AppSettings {
  notifications: {
    enabled: boolean;
    incidentUpdates: boolean;
    validationRequests: boolean;
    communityUpdates: boolean;
    systemAlerts: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  privacy: {
    shareLocation: boolean;
    showProfile: boolean;
    allowMessages: boolean;
    dataCollection: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    units: 'metric' | 'imperial';
    mapStyle: 'standard' | 'satellite' | 'hybrid';
  };
  reporting: {
    autoLocation: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    aiAnalysis: boolean;
    offlineMode: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

interface SettingsManagerProps {
  onSettingsChange: (settings: AppSettings) => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({
  onSettingsChange,
  onExportData,
  onDeleteAccount,
  onLogout,
}) => {
  const theme = useTheme();
  
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      enabled: true,
      incidentUpdates: true,
      validationRequests: true,
      communityUpdates: false,
      systemAlerts: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    },
    privacy: {
      shareLocation: true,
      showProfile: true,
      allowMessages: true,
      dataCollection: true,
    },
    display: {
      theme: 'auto',
      language: 'en',
      units: 'metric',
      mapStyle: 'standard',
    },
    reporting: {
      autoLocation: true,
      imageQuality: 'high',
      aiAnalysis: true,
      offlineMode: true,
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false,
      screenReader: false,
    },
  });

  const [storageUsage, setStorageUsage] = useState({
    total: 0,
    images: 0,
    cache: 0,
    offline: 0,
  });

  useEffect(() => {
    loadSettings();
    calculateStorageUsage();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      onSettingsChange(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSetting = (category: keyof AppSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const calculateStorageUsage = async () => {
    // Mock storage calculation - in real app, calculate actual usage
    setStorageUsage({
      total: 156.7,
      images: 89.3,
      cache: 45.2,
      offline: 22.2,
    });
  };

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive important updates.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location access is needed to automatically tag incident reports.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
    }
    updateSetting('notifications', 'enabled', enabled);
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestLocationPermissions();
      if (!granted) return;
    }
    updateSetting('privacy', 'shareLocation', enabled);
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove temporary files and may improve app performance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Implement cache clearing logic
            setStorageUsage(prev => ({ ...prev, cache: 0 }));
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const clearOfflineData = async () => {
    Alert.alert(
      'Clear Offline Data',
      'This will remove all offline incident data. Make sure you have synced recent changes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Implement offline data clearing logic
            setStorageUsage(prev => ({ ...prev, offline: 0 }));
            Alert.alert('Success', 'Offline data cleared successfully');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDeleteAccount,
        },
      ]
    );
  };

  const formatStorageSize = (sizeInMB: number): string => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Notifications Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          
          <List.Item
            title="Enable Notifications"
            description="Receive important updates and alerts"
            left={props => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={settings.notifications.enabled}
                onValueChange={handleNotificationToggle}
              />
            )}
          />
          
          {settings.notifications.enabled && (
            <>
              <Divider style={styles.divider} />
              
              <List.Item
                title="Incident Updates"
                description="Status changes on your reports"
                left={props => <List.Icon {...props} icon="flag" />}
                right={() => (
                  <Switch
                    value={settings.notifications.incidentUpdates}
                    onValueChange={(value) => updateSetting('notifications', 'incidentUpdates', value)}
                  />
                )}
              />
              
              <List.Item
                title="Validation Requests"
                description="When your input is needed"
                left={props => <List.Icon {...props} icon="checkmark-circle" />}
                right={() => (
                  <Switch
                    value={settings.notifications.validationRequests}
                    onValueChange={(value) => updateSetting('notifications', 'validationRequests', value)}
                  />
                )}
              />
              
              <List.Item
                title="Community Updates"
                description="News and announcements"
                left={props => <List.Icon {...props} icon="people" />}
                right={() => (
                  <Switch
                    value={settings.notifications.communityUpdates}
                    onValueChange={(value) => updateSetting('notifications', 'communityUpdates', value)}
                  />
                )}
              />
            </>
          )}
        </Card.Content>
      </Card>

      {/* Privacy Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🔒 Privacy & Security</Text>
          
          <List.Item
            title="Share Location"
            description="Allow location-based features"
            left={props => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={settings.privacy.shareLocation}
                onValueChange={handleLocationToggle}
              />
            )}
          />
          
          <List.Item
            title="Public Profile"
            description="Show your profile to other users"
            left={props => <List.Icon {...props} icon="account" />}
            right={() => (
              <Switch
                value={settings.privacy.showProfile}
                onValueChange={(value) => updateSetting('privacy', 'showProfile', value)}
              />
            )}
          />
          
          <List.Item
            title="Allow Messages"
            description="Receive messages from other users"
            left={props => <List.Icon {...props} icon="message" />}
            right={() => (
              <Switch
                value={settings.privacy.allowMessages}
                onValueChange={(value) => updateSetting('privacy', 'allowMessages', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Display Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🎨 Display & Language</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Theme</Text>
            <SegmentedButtons
              value={settings.display.theme}
              onValueChange={(value) => updateSetting('display', 'theme', value)}
              buttons={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'Auto' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Map Style</Text>
            <SegmentedButtons
              value={settings.display.mapStyle}
              onValueChange={(value) => updateSetting('display', 'mapStyle', value)}
              buttons={[
                { value: 'standard', label: 'Standard' },
                { value: 'satellite', label: 'Satellite' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Reporting Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📝 Reporting</Text>
          
          <List.Item
            title="Auto-detect Location"
            description="Automatically add GPS coordinates"
            left={props => <List.Icon {...props} icon="crosshairs-gps" />}
            right={() => (
              <Switch
                value={settings.reporting.autoLocation}
                onValueChange={(value) => updateSetting('reporting', 'autoLocation', value)}
              />
            )}
          />
          
          <List.Item
            title="AI Analysis"
            description="Use AI to analyze incident photos"
            left={props => <List.Icon {...props} icon="brain" />}
            right={() => (
              <Switch
                value={settings.reporting.aiAnalysis}
                onValueChange={(value) => updateSetting('reporting', 'aiAnalysis', value)}
              />
            )}
          />
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Image Quality</Text>
            <SegmentedButtons
              value={settings.reporting.imageQuality}
              onValueChange={(value) => updateSetting('reporting', 'imageQuality', value)}
              buttons={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Storage Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>💾 Storage</Text>
          
          <Surface style={styles.storageInfo} elevation={1}>
            <Text style={styles.storageTitle}>
              Total Usage: {formatStorageSize(storageUsage.total)}
            </Text>
            
            <View style={styles.storageBreakdown}>
              <View style={styles.storageItem}>
                <Text style={styles.storageLabel}>Images</Text>
                <Text style={styles.storageValue}>{formatStorageSize(storageUsage.images)}</Text>
              </View>
              <View style={styles.storageItem}>
                <Text style={styles.storageLabel}>Cache</Text>
                <Text style={styles.storageValue}>{formatStorageSize(storageUsage.cache)}</Text>
              </View>
              <View style={styles.storageItem}>
                <Text style={styles.storageLabel}>Offline Data</Text>
                <Text style={styles.storageValue}>{formatStorageSize(storageUsage.offline)}</Text>
              </View>
            </View>
          </Surface>
          
          <View style={styles.storageActions}>
            <Button
              mode="outlined"
              onPress={clearCache}
              icon="delete"
              style={styles.storageButton}
            >
              Clear Cache
            </Button>
            <Button
              mode="outlined"
              onPress={clearOfflineData}
              icon="cloud-off"
              style={styles.storageButton}
            >
              Clear Offline
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Account Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>👤 Account</Text>
          
          <View style={styles.accountActions}>
            <Button
              mode="outlined"
              onPress={onExportData}
              icon="download"
              style={styles.accountButton}
            >
              Export My Data
            </Button>
            
            <Button
              mode="outlined"
              onPress={onLogout}
              icon="logout"
              style={styles.accountButton}
            >
              Sign Out
            </Button>
            
            <Button
              mode="contained"
              onPress={handleDeleteAccount}
              icon="delete"
              style={[styles.accountButton, styles.deleteButton]}
              buttonColor={customColors.severityHigh}
            >
              Delete Account
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* App Info */}
      <Surface style={styles.appInfo} elevation={1}>
        <Text style={styles.appInfoText}>
          Mangrove Watch v1.0.0
        </Text>
        <Text style={styles.appInfoText}>
          Built with ❤️ for conservation
        </Text>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  sectionCard: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: customColors.mangrove,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  settingItem: {
    marginVertical: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  storageInfo: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  storageBreakdown: {
    gap: spacing.sm,
  },
  storageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: 14,
    color: '#666',
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  storageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  storageButton: {
    flex: 1,
  },
  accountActions: {
    gap: spacing.md,
  },
  accountButton: {
    marginVertical: spacing.xs,
  },
  deleteButton: {
    marginTop: spacing.lg,
  },
  appInfo: {
    margin: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: 8,
  },
  appInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default SettingsManager;
