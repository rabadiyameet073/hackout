import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';
import IncidentListScreen from '../screens/IncidentListScreen';
import ValidationScreen from '../screens/ValidationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: 'Mangrove Watch' }}
      />
      <Stack.Screen 
        name="IncidentDetail" 
        component={IncidentDetailScreen}
        options={{ title: 'Incident Details' }}
      />
      <Stack.Screen 
        name="IncidentList" 
        component={IncidentListScreen}
        options={{ title: 'All Incidents' }}
      />
      <Stack.Screen 
        name="Validation" 
        component={ValidationScreen}
        options={{ title: 'Validate Incident' }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
};

// Map Stack
const MapStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MapMain" 
        component={MapScreen} 
        options={{ title: 'Incident Map' }}
      />
      <Stack.Screen 
        name="IncidentDetail" 
        component={IncidentDetailScreen}
        options={{ title: 'Incident Details' }}
      />
    </Stack.Navigator>
  );
};

// Report Stack
const ReportStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ReportMain" 
        component={ReportScreen} 
        options={{ title: 'Report Incident' }}
      />
    </Stack.Navigator>
  );
};

// Leaderboard Stack
const LeaderboardStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="LeaderboardMain" 
        component={LeaderboardScreen} 
        options={{ title: 'Leaderboard' }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack
const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="IncidentDetail" 
        component={IncidentDetailScreen}
        options={{ title: 'Incident Details' }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Report':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Leaderboard':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapStack}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportStack}
        options={{
          tabBarLabel: 'Report',
          tabBarIconStyle: {
            transform: [{ scale: 1.2 }],
          },
        }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardStack}
        options={{
          tabBarLabel: 'Leaderboard',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
