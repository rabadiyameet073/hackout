import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../../utils/theme';

const WelcomeScreen: React.FC = ({ navigation }: any) => {
  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <View style={styles.content}>
        <Surface style={styles.logoContainer} elevation={4}>
          <Text style={styles.logo}>🌿</Text>
        </Surface>
        <Text style={styles.title}>Welcome to Mangrove Watch</Text>
        <Text style={styles.subtitle}>Join the community protecting our coastal forests</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Permissions')} style={styles.button}>
          Get Started
        </Button>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  logoContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.md },
  subtitle: { fontSize: 16, color: '#A8DAB5', textAlign: 'center', marginBottom: spacing.xxl },
  button: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
});

export default WelcomeScreen;
