import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../../utils/theme';

const ResetPasswordScreen: React.FC = ({ navigation }: any) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <View style={styles.content}>
        <Surface style={styles.formContainer} elevation={8}>
          <Text style={styles.title}>Reset Password</Text>
          <TextInput label="New Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />
          <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" secureTextEntry style={styles.input} />
          <Button mode="contained" style={styles.button}>Reset Password</Button>
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
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: spacing.xl, color: customColors.mangrove },
  input: { marginBottom: spacing.md },
  button: { marginVertical: spacing.md },
});

export default ResetPasswordScreen;
