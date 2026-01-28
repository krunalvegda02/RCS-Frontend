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

      if (!token || !isAuthenticated) {
        dispatch(logout())
      }
    }

    // Check immediately
    checkAuth()

    // Check every 5 minutes
    const interval = setInterval(checkAuth, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [dispatch, token, isAuthenticated, location.pathname])

  return null
}

export default AuthChecker