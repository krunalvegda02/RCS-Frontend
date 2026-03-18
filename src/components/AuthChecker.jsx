import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { logout } from '../redux/slices/authSlice.js'

const AuthChecker = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { token, isAuthenticated } = useSelector(state => state.auth)

  useEffect(() => {
    const checkAuth = () => {
      // Don't check auth on public routes
      const publicRoutes = ['/', '/login', '/register']
      if (publicRoutes.includes(location.pathname)) {
        return
      }

      // Only logout if both token and isAuthenticated are false
      // This prevents unnecessary logouts due to temporary state issues
      if (!token && !isAuthenticated) {
        console.log('Auth check failed: no token and not authenticated')
        dispatch(logout())
      }
    }

    // Check immediately
    checkAuth()

    // Reduce frequency to every 10 minutes instead of 5
    const interval = setInterval(checkAuth, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [dispatch, token, isAuthenticated, location.pathname])

  return null
}

export default AuthChecker