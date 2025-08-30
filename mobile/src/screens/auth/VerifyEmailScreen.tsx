import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../../utils/theme';

const VerifyEmailScreen: React.FC = ({ navigation }: any) => {
  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <View style={styles.content}>
        <Surface style={styles.formContainer} elevation={8}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>We've sent a verification link to your email address</Text>
          <Button mode="contained" style={styles.button}>Resend Email</Button>
          <Button mode="text" onPress={() => navigation.navigate('Login')}>Back to Sign In</Button>
        </Surface>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  formContainer: { padding: spacing.xl, borderRadius: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: spacing.sm, color: customColors.mangrove },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: spacing.xl },
  button: { marginVertical: spacing.md },
});

export default VerifyEmailScreen;
