import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../../utils/theme';

const RegisterScreen: React.FC = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.formContainer} elevation={8}>
          <Text style={styles.title}>Join Mangrove Watch</Text>
          <TextInput label="Full Name" value={fullName} onChangeText={setFullName} mode="outlined" style={styles.input} />
          <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" style={styles.input} />
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} />
          <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />
          <Button mode="contained" style={styles.button}>Sign Up</Button>
          <Button mode="text" onPress={() => navigation.navigate('Login')}>Already have an account? Sign In</Button>
        </Surface>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  formContainer: { padding: spacing.xl, borderRadius: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: spacing.xl, color: customColors.mangrove },
  input: { marginBottom: spacing.md },
  button: { marginVertical: spacing.md },
});

export default RegisterScreen;
