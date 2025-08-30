import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High Priority Incident',
    message: 'Critical mangrove cutting reported in Protected Area #7',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    actionUrl: '/incidents/123',
  },
  {
    id: '2',
    type: 'info',
    title: 'New User Registration',
    message: '5 new users registered in the last hour',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Validation Complete',
    message: 'AI validation completed for 12 pending incidents',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'System Alert',
    message: 'Database backup failed - manual intervention required',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false,
  },
  {
    id: '5',
    type: 'info',
    title: 'Weekly Report',
    message: 'Weekly analytics report is ready for review',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return <WarningIcon color="warning" />
    case 'error':
      return <ErrorIcon color="error" />
    case 'success':
      return <CheckCircleIcon color="success" />
    case 'info':
    default:
      return <InfoIcon color="info" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'success':
      return 'success'
    case 'info':
    default:
      return 'info'
  }
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const unreadCount = mockNotifications.filter(n => !n.read).length

  const handleMarkAllAsRead = () => {
    // Implementation would update all notifications as read
    console.log('Mark all as read')
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      // Navigate to the action URL
      console.log('Navigate to:', notification.actionUrl)
    }
    // Mark as read
    console.log('Mark as read:', notification.id)
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 400, maxWidth: '90vw' },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        {unreadCount > 0 && (
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
            sx={{ mt: 1 }}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      <List sx={{ p: 0 }}>
        {mockNotifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem
              button
              onClick={() => handleNotificationClick(notification)}
              sx={{
                bgcolor: notification.read ? 'transparent' : 'action.hover',
                borderLeft: notification.read ? 'none' : `4px solid`,
                borderLeftColor: `${getNotificationColor(notification.type)}.main`,
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: notification.read ? 'normal' : 'bold',
                        flex: 1,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    {!notification.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {notification.message}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < mockNotifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {mockNotifications.length === 0 && (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <InfoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            No notifications at the moment
          </Typography>
        </Box>
      )}
    </Drawer>
  )
}
