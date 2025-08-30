import React from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  useTheme,
} from '@mui/material'
import {
  Report as ReportIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Eco as EcoIcon,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import StatCard from '@/components/Common/StatCard'

// Mock data
const incidentTrendData = [
  { month: 'Jan', incidents: 45, resolved: 38 },
  { month: 'Feb', incidents: 52, resolved: 45 },
  { month: 'Mar', incidents: 48, resolved: 42 },
  { month: 'Apr', incidents: 61, resolved: 55 },
  { month: 'May', incidents: 55, resolved: 48 },
  { month: 'Jun', incidents: 67, resolved: 58 },
]

const severityData = [
  { name: 'Low', value: 35, color: '#4CAF50' },
  { name: 'Medium', value: 45, color: '#FF9800' },
  { name: 'High', value: 15, color: '#F44336' },
  { name: 'Critical', value: 5, color: '#9C27B0' },
]

const recentActivities = [
  {
    id: '1',
    type: 'incident',
    title: 'New critical incident reported',
    description: 'Illegal cutting in Protected Area #7',
    timestamp: '2 minutes ago',
    severity: 'critical',
  },
  {
    id: '2',
    type: 'validation',
    title: 'AI validation completed',
    description: '12 incidents processed with 94% accuracy',
    timestamp: '15 minutes ago',
    severity: 'info',
  },
  {
    id: '3',
    type: 'user',
    title: 'New expert validator joined',
    description: 'Dr. Maria Santos from Marine Biology Institute',
    timestamp: '1 hour ago',
    severity: 'success',
  },
  {
    id: '4',
    type: 'system',
    title: 'System maintenance completed',
    description: 'Database optimization and backup completed',
    timestamp: '2 hours ago',
    severity: 'info',
  },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'incident':
      return <ReportIcon />
    case 'validation':
      return <VerifiedIcon />
    case 'user':
      return <PeopleIcon />
    case 'system':
    default:
      return <CheckCircleIcon />
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'error'
    case 'warning':
      return 'warning'
    case 'success':
      return 'success'
    case 'info':
    default:
      return 'info'
  }
}

export default function DashboardPage() {
  const theme = useTheme()

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage mangrove conservation efforts across all regions
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Incidents"
            value={1247}
            subtitle="This month"
            trend={{ value: 12, direction: 'up', period: 'last month' }}
            icon={<ReportIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={8934}
            subtitle="Community members"
            trend={{ value: 8, direction: 'up', period: 'last month' }}
            icon={<PeopleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Validations"
            value={23}
            subtitle="Awaiting review"
            trend={{ value: -15, direction: 'down', period: 'last week' }}
            icon={<VerifiedIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Areas Protected"
            value="2,847 ha"
            subtitle="Mangrove coverage"
            trend={{ value: 3, direction: 'up', period: 'last quarter' }}
            icon={<EcoIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Incident Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Incident Trends
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monthly incident reports and resolution rates
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incidentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="incidents"
                      stackId="1"
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.light}
                      name="Reported"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stackId="2"
                      stroke={theme.palette.success.main}
                      fill={theme.palette.success.light}
                      name="Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Severity Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Incident Severity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Distribution by severity level
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {severityData.map((item) => (
                  <Box
                    key={item.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: item.color,
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Activity
                </Typography>
                <Button size="small" color="primary">
                  View All
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity, index) => (
                  <ListItem
                    key={activity.id}
                    sx={{
                      px: 0,
                      borderBottom:
                        index < recentActivities.length - 1
                          ? `1px solid ${theme.palette.divider}`
                          : 'none',
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: `${getSeverityColor(activity.severity)}.light`,
                          color: `${getSeverityColor(activity.severity)}.main`,
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <ScheduleIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.disabled">
                              {activity.timestamp}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ReportIcon />}
                    sx={{ py: 2, flexDirection: 'column', height: 80 }}
                  >
                    <Typography variant="body2">Review</Typography>
                    <Typography variant="body2">Incidents</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VerifiedIcon />}
                    sx={{ py: 2, flexDirection: 'column', height: 80 }}
                  >
                    <Typography variant="body2">Validate</Typography>
                    <Typography variant="body2">Reports</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    sx={{ py: 2, flexDirection: 'column', height: 80 }}
                  >
                    <Typography variant="body2">Manage</Typography>
                    <Typography variant="body2">Users</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    sx={{ py: 2, flexDirection: 'column', height: 80 }}
                  >
                    <Typography variant="body2">View</Typography>
                    <Typography variant="body2">Analytics</Typography>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
