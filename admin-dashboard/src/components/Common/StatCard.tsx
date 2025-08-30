import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
} from '@mui/material'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'flat'
    period?: string
  }
  icon?: React.ReactElement
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  loading?: boolean
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
  loading = false,
}: StatCardProps) {
  const theme = useTheme()

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp sx={{ fontSize: 16 }} />
      case 'down':
        return <TrendingDown sx={{ fontSize: 16 }} />
      case 'flat':
      default:
        return <TrendingFlat sx={{ fontSize: 16 }} />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'success'
      case 'down':
        return 'error'
      case 'flat':
      default:
        return 'info'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'action.hover',
                mr: 2,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  height: 16,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                  width: '60%',
                }}
              />
              <Box
                sx={{
                  height: 12,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  width: '40%',
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              height: 32,
              bgcolor: 'action.hover',
              borderRadius: 1,
              mb: 1,
              width: '80%',
            }}
          />
          <Box
            sx={{
              height: 16,
              bgcolor: 'action.hover',
              borderRadius: 1,
              width: '50%',
            }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: `${color}.light`,
                color: `${color}.contrastText`,
                mr: 2,
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 24 } })}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {trend && (
              <Chip
                icon={getTrendIcon(trend.direction)}
                label={`${trend.value > 0 ? '+' : ''}${trend.value}%`}
                size="small"
                color={getTrendColor(trend.direction) as any}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>

        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 'bold',
            color: `${color}.main`,
            mb: subtitle ? 1 : 0,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>

        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {trend?.period && (
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
            vs {trend.period}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
