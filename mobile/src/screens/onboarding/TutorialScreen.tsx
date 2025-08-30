import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { completeOnboarding } from '../../store/slices/appSlice';
import { customColors, spacing } from '../../utils/theme';

const TutorialScreen: React.FC = ({ navigation }: any) => {
  const dispatch = useDispatch();

  const handleComplete = () => {
    dispatch(completeOnboarding());
  };

  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>Start protecting mangroves by reporting incidents in your area</Text>
        <Button mode="contained" onPress={handleComplete} style={styles.button}>
          Start Exploring
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
  button: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
});

export default TutorialScreen;
