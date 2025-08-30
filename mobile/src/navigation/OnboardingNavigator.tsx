import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import onboarding screens (we'll create these next)
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import PermissionsScreen from '../screens/onboarding/PermissionsScreen';
import TutorialScreen from '../screens/onboarding/TutorialScreen';
import LocationSetupScreen from '../screens/onboarding/LocationSetupScreen';

const Stack = createStackNavigator();

const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#2E7D32' },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
      />
      <Stack.Screen 
        name="Permissions" 
        component={PermissionsScreen}
      />
      <Stack.Screen 
        name="LocationSetup" 
        component={LocationSetupScreen}
      />
      <Stack.Screen 
        name="Tutorial" 
        component={TutorialScreen}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
