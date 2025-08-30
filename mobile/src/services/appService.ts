import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Network from 'expo-network';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { store } from '../store';
import { 
  setLocationPermission, 
  setCameraPermission, 
  setNotificationsEnabled,
  setCurrentLocation,
  setNetworkStatus 
} from '../store/slices/appSlice';
import { authService } from './authService';
import { getCurrentUser } from '../store/slices/authSlice';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class AppService {
  private networkListener: any = null;

  /**
   * Initialize the app - called on app startup
   */
  async initializeApp(): Promise<void> {
    try {
      console.log('🚀 Initializing Mangrove Watch app...');

      // Check network status
      await this.checkNetworkStatus();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();

      // Request permissions
      await this.requestPermissions();

      // Try to restore user session
      await this.restoreUserSession();

      // Get current location if permission granted
      await this.getCurrentLocation();

      // Setup notifications
      await this.setupNotifications();

      console.log('✅ App initialization complete');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check and update network status
   */
  async checkNetworkStatus(): Promise<void> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const isConnected = networkState.isConnected && networkState.isInternetReachable;
      
      store.dispatch(setNetworkStatus(isConnected ? 'online' : 'offline'));
      
      console.log(`📶 Network status: ${isConnected ? 'Online' : 'Offline'}`);
    } catch (error) {
      console.error('Failed to check network status:', error);
      store.dispatch(setNetworkStatus('offline'));
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring(): void {
    // Note: expo-network doesn't have a built-in listener
    // We'll check network status periodically
    setInterval(async () => {
      await this.checkNetworkStatus();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Request necessary permissions
   */
  async requestPermissions(): Promise<void> {
    try {
      // Request location permission
      const locationPermission = await this.requestLocationPermission();
      store.dispatch(setLocationPermission(locationPermission));

      // Request notification permission
      const notificationPermission = await this.requestNotificationPermission();
      store.dispatch(setNotificationsEnabled(notificationPermission));

      console.log('📋 Permissions requested');
    } catch (error) {
      console.error('Failed to request permissions:', error);
    }
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }
      
      return true;
    } catch (error) {
      console.error('Location permission request failed:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Notifications not supported on simulator');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
      
      return true;
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<void> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const address = addresses[0];
        const formattedAddress = address ? 
          `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim() :
          undefined;

        store.dispatch(setCurrentLocation({
          latitude,
          longitude,
          address: formattedAddress,
        }));

        console.log(`📍 Location updated: ${latitude}, ${longitude}`);
      } catch (geocodeError) {
        // Set location without address if geocoding fails
        store.dispatch(setCurrentLocation({
          latitude,
          longitude,
        }));
        console.log('📍 Location updated (without address)');
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  }

  /**
   * Setup notifications
   */
  async setupNotifications(): Promise<void> {
    try {
      if (!Device.isDevice) {
        return;
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2E7D32',
        });

        await Notifications.setNotificationChannelAsync('incidents', {
          name: 'Incident Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF5722',
        });

        await Notifications.setNotificationChannelAsync('gamification', {
          name: 'Achievements & Rewards',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#4CAF50',
        });
      }

      console.log('🔔 Notifications configured');
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }

  /**
   * Restore user session if token exists
   */
  async restoreUserSession(): Promise<void> {
    try {
      if (authService.isAuthenticated()) {
        console.log('🔐 Restoring user session...');
        await store.dispatch(getCurrentUser());
        console.log('✅ User session restored');
      }
    } catch (error) {
      console.error('Failed to restore user session:', error);
      // Clear invalid token
      await authService.logout();
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    channelId: string = 'default'
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Date | number,
    data?: any
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: typeof trigger === 'number' ? 
          { seconds: trigger } : 
          { date: trigger },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Get device info
   */
  getDeviceInfo(): {
    isDevice: boolean;
    platform: string;
    osVersion: string;
    deviceName?: string;
    modelName?: string;
  } {
    return {
      isDevice: Device.isDevice,
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      deviceName: Device.deviceName,
      modelName: Device.modelName,
    };
  }

  /**
   * Check if app needs update
   */
  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    version?: string;
    updateUrl?: string;
  }> {
    try {
      // This would typically check with your update service
      // For now, return no updates available
      return { hasUpdate: false };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return { hasUpdate: false };
    }
  }

  /**
   * Cleanup app resources
   */
  cleanup(): void {
    if (this.networkListener) {
      this.networkListener.remove();
    }
  }
}

export const appService = new AppService();

// Export initialization function for use in App.tsx
export const initializeApp = () => appService.initializeApp();
