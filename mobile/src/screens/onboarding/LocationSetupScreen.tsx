import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../../utils/theme';

const LocationSetupScreen: React.FC = ({ navigation }: any) => {
  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Location Setup</Text>
        <Text style={styles.subtitle}>Help us show relevant incidents in your area</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Tutorial')} style={styles.button}>
          Enable Location
        </Button>
        <Button mode="text" onPress={() => navigation.navigate('Tutorial')} labelStyle={styles.skipLabel}>
          Skip
        </Button>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: '#A8DAB5', textAlign: 'center', marginBottom: spacing.xl },
  button: { marginBottom: spacing.md },
  skipLabel: { color: '#A8DAB5' },
});

export default LocationSetupScreen;
