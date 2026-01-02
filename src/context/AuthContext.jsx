import React, { createContext, useContext, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout as logoutAction, fetchProfile } from '../redux/slices/authSlice.js'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token, isAuthenticated, loading } = useSelector(state => state.auth)

  const login = useCallback((userData, authToken) => {
    // Login state is managed by Redux
    // This is just for compatibility
  }, [])

  const logout = useCallback(() => {
    dispatch(logoutAction())
    toast.success('Logged out successfully')
    
    // Navigate with reason
    setTimeout(() => {
      navigate('/login?reason=logged_out', { replace: true })
    }, 300)
  }, [dispatch, navigate])

  const refreshUser = useCallback(async () => {
    if (user?._id && token) {
      try {
        await dispatch(fetchProfile()).unwrap()
      } catch (error) {
        console.error('Failed to refresh user:', error)
      }
    }
  }, [dispatch, user?._id, token])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      refreshUser,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}