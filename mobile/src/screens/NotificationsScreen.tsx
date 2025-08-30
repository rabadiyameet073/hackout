import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Card } from 'react-native-paper';
import { spacing } from '../utils/theme';

const NotificationsScreen: React.FC = () => {
  const notifications = [
    {
      id: '1',
      title: 'Incident Verified',
      description: 'Your report "Illegal cutting in Mangrove Bay" has been verified',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'New Badge Earned',
      description: 'You earned the "First Reporter" badge!',
      time: '1 day ago',
      read: true,
    },
  ];

  const renderNotification = ({ item }: { item: any }) => (
    <Card style={styles.notificationCard}>
      <List.Item
        title={item.title}
        description={item.description}
        right={() => <Text style={styles.timeText}>{item.time}</Text>}
        titleStyle={!item.read ? styles.unreadTitle : undefined}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    marginBottom: spacing.sm,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
});

export default NotificationsScreen;
