import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';
import { spacing } from '../utils/theme';

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Push Notifications"
          description="Receive updates about incidents"
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          )}
        />
        <Divider />
        <List.Subheader>Privacy</List.Subheader>
        <List.Item
          title="Share Location"
          description="Help show relevant incidents"
          right={() => (
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
            />
          )}
        />
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default SettingsScreen;
