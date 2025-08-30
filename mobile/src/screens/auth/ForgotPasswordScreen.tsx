import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../../utils/theme';

const ForgotPasswordScreen: React.FC = ({ navigation }: any) => {
  const [email, setEmail] = useState('');

  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <View style={styles.content}>
        <Surface style={styles.formContainer} elevation={8}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} />
          <Button mode="contained" style={styles.button}>Send Reset Link</Button>
          <Button mode="text" onPress={() => navigation.goBack()}>Back to Sign In</Button>
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
  input: { marginBottom: spacing.md },
  button: { marginVertical: spacing.md },
});

export default ForgotPasswordScreen;
