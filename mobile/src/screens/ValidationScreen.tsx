import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  TextInput,
  RadioButton,
  useTheme 
} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import { customColors, spacing } from '../utils/theme';

const ValidationScreen: React.FC = ({ route, navigation }: any) => {
  const theme = useTheme();
  const { incidentId } = route.params;
  
  const [score, setScore] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!score) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a validation score',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement validation submission
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Validation submitted successfully',
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit validation',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text style={styles.title}>Validate Incident</Text>
          <Text style={styles.subtitle}>
            Help verify this incident report by providing your assessment
          </Text>

          <Text style={styles.fieldLabel}>Validation Score *</Text>
          <RadioButton.Group onValueChange={setScore} value={score}>
            <View style={styles.radioOption}>
              <RadioButton value="1" />
              <Text style={styles.radioLabel}>1 - Not credible</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="2" />
              <Text style={styles.radioLabel}>2 - Unlikely</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="3" />
              <Text style={styles.radioLabel}>3 - Possible</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="4" />
              <Text style={styles.radioLabel}>4 - Likely</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="5" />
              <Text style={styles.radioLabel}>5 - Very credible</Text>
            </View>
          </RadioButton.Group>

          <TextInput
            label="Comments (Optional)"
            value={comments}
            onChangeText={setComments}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Provide additional context for your validation"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
            icon="check"
          >
            Submit Validation
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  formCard: {
    margin: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: customColors.mangrove,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  radioLabel: {
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  input: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default ValidationScreen;
