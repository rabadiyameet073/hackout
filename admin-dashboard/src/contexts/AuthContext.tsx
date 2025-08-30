import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'

import { authAPI } from '@/services/api'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'moderator' | 'analyst'
  avatar_url?: string
  permissions: string[]
  last_login?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await authAPI.getProfile()
      if (response.data.success) {
        setUser(response.data.user)
      } else {
        localStorage.removeItem('admin_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('admin_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      
      if (response.data.success) {
        const { token, user: userData } = response.data
        
        // Check if user has admin privileges
        if (!['admin', 'moderator', 'analyst'].includes(userData.role)) {
          throw new Error('Insufficient privileges for admin access')
        }

        localStorage.setItem('admin_token', token)
        setUser(userData)
        toast.success(`Welcome back, ${userData.full_name}!`)
      } else {
        throw new Error(response.data.message || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const message = error.response?.data?.message || error.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile()
      if (response.data.success) {
        setUser(response.data.user)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
