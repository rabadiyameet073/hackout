import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Report as ReportIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Eco as EcoIcon,
} from '@mui/icons-material'

import { useAuth } from '@/contexts/AuthContext'

interface SidebarProps {
  onItemClick?: () => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactElement
  path: string
  badge?: string | number
  permissions?: string[]
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'incidents',
    label: 'Incidents',
    icon: <ReportIcon />,
    path: '/incidents',
    badge: 'new',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <PeopleIcon />,
    path: '/users',
    permissions: ['manage_users'],
  },
  {
    id: 'validations',
    label: 'Validations',
    icon: <VerifiedUserIcon />,
    path: '/validations',
    badge: 12,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <AnalyticsIcon />,
    path: '/analytics',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    permissions: ['admin'],
  },
]

export default function Sidebar({ onItemClick }: SidebarProps) {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleNavigation = (path: string) => {
    navigate(path)
    onItemClick?.()
  }

  const hasPermission = (permissions?: string[]) => {
    if (!permissions || permissions.length === 0) return true
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === 'admin') return true
    
    // Check specific permissions
    return permissions.some(permission => 
      user.permissions?.includes(permission) || user.role === permission
    )
  }

  const filteredNavItems = navItems.filter(item => hasPermission(item.permissions))

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <EcoIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
            Mangrove
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin Panel
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1 }}>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path
            
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'primary.contrastText' : 'text.secondary',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color={typeof item.badge === 'string' ? 'secondary' : 'error'}
                      sx={{
                        height: 20,
                        fontSize: '0.75rem',
                        bgcolor: isActive ? 'rgba(255,255,255,0.2)' : undefined,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {user?.email}
          </Typography>
          <Chip
            label={user?.role?.toUpperCase()}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mt: 1, fontSize: '0.7rem', height: 20 }}
          />
        </Box>
      </Box>
    </Box>
  )
}
