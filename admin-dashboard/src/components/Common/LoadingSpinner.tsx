import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

interface LoadingSpinnerProps {
  size?: number
  message?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  size = 40, 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={fullScreen ? { minHeight: '100vh' } : { py: 4 }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )

  return content
}
