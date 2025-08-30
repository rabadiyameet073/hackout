import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, List } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { customColors, spacing } from '../../utils/theme';

const PermissionsScreen: React.FC = ({ navigation }: any) => {
  return (
    <LinearGradient colors={[customColors.mangrove, '#1B5E20']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Permissions Needed</Text>
        <Text style={styles.subtitle}>We need these permissions to provide the best experience</Text>
        
        <View style={styles.permissionsList}>
          <List.Item
            title="Camera"
            description="Take photos of incidents"
            left={props => <List.Icon {...props} icon="camera" color="#FFFFFF" />}
            titleStyle={styles.permissionTitle}
            descriptionStyle={styles.permissionDescription}
          />
          <List.Item
            title="Location"
            description="Tag incidents with GPS coordinates"
            left={props => <List.Icon {...props} icon="map-marker" color="#FFFFFF" />}
            titleStyle={styles.permissionTitle}
            descriptionStyle={styles.permissionDescription}
          />
          <List.Item
            title="Notifications"
            description="Stay updated on incident status"
            left={props => <List.Icon {...props} icon="bell" color="#FFFFFF" />}
            titleStyle={styles.permissionTitle}
            descriptionStyle={styles.permissionDescription}
          />
        </View>
        
        <Button mode="contained" onPress={() => navigation.navigate('LocationSetup')} style={styles.button}>
          Grant Permissions
        </Button>
        <Button mode="text" onPress={() => navigation.navigate('Tutorial')} labelStyle={styles.skipLabel}>
          Skip for Now
        </Button>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: '#A8DAB5', textAlign: 'center', marginBottom: spacing.xl },
  permissionsList: { marginBottom: spacing.xl },
  permissionTitle: { color: '#FFFFFF' },
  permissionDescription: { color: '#A8DAB5' },
  button: { marginBottom: spacing.md },
  skipLabel: { color: '#A8DAB5' },
});

export default PermissionsScreen;
