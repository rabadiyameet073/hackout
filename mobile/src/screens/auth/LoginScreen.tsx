import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Surface, 
  useTheme,
  HelperText,
  Divider 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

import { AppDispatch, RootState } from '../../store';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { customColors, spacing } from '../../utils/theme';

const LoginScreen: React.FC = ({ navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    dispatch(clearError());

    // Validate inputs
    let hasErrors = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      const result = await dispatch(loginUser({ email: email.trim(), password }));
      
      if (loginUser.fulfilled.match(result)) {
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: 'You have successfully logged in.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: result.payload as string || 'Please check your credentials and try again.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@mangrovewatch.org');
    setPassword('demo123456');
  };

  return (
    <LinearGradient
      colors={[customColors.mangrove, '#1B5E20']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Surface style={styles.logoSurface} elevation={4}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </Surface>
            <Text style={styles.appTitle}>Mangrove Watch</Text>
            <Text style={styles.appSubtitle}>Protecting Our Coastal Forests</Text>
          </View>

          {/* Login Form */}
          <Surface style={styles.formContainer} elevation={8}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue protecting mangroves</Text>

            <View style={styles.inputContainer}>
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!emailError}
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                error={!!passwordError}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
            </View>

            {error && (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleDemoLogin}
              style={styles.demoButton}
              icon="play"
            >
              Try Demo Account
            </Button>
          </Surface>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              labelStyle={styles.signupButtonLabel}
            >
              Sign Up
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoSurface: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.md,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#A8DAB5',
    textAlign: 'center',
  },
  formContainer: {
    padding: spacing.xl,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: customColors.mangrove,
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.xs,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  loginButton: {
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  forgotButton: {
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  demoButton: {
    borderColor: customColors.mangrove,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  signupButtonLabel: {
    color: '#A8DAB5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
