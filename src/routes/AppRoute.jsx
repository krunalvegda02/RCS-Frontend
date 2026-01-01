import React, { Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const AppRoute = ({ children, allowedRoles, requiresAuth = true }) => {
  const { user, isAuthenticated, loading, token } = useSelector(state => state.auth)

  console.log('AppRoute state:', { user, isAuthenticated, loading, token, allowedRoles, userRole: user?.role })

  // Don't show loading for public routes
  if (loading && requiresAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Public routes
  if (!requiresAuth) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }>
        {children}
      </Suspense>
    )
  }

  // Protected routes - check both isAuthenticated and token
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  // Role-based access - case insensitive comparison
  if (allowedRoles && !allowedRoles.some(role => role.toLowerCase() === user?.role?.toLowerCase())) {
    console.log('Role mismatch:', { userRole: user?.role, allowedRoles })
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      {children}
    </Suspense>
  )
}

export default AppRoute