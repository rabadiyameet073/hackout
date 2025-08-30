import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { spacing } from '../utils/theme';

const EditProfileScreen: React.FC = ({ navigation }: any) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    // TODO: Implement profile update
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text style={styles.title}>Edit Profile</Text>
          
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
          >
            Save Changes
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});

export default EditProfileScreen;
