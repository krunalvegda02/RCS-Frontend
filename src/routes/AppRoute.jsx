import React, { Suspense, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const AppRoute = ({ children, allowedRoles, requiresAuth = true }) => {
  const { user, isAuthenticated, loading, token } = useSelector(state => state.auth)

  // Memoize the redirect path to prevent unnecessary re-renders
  const redirectPath = useMemo(() => {
    if (!requiresAuth) return null;
    if (!isAuthenticated || !token) return '/login?reason=unauthorized';
    if (allowedRoles && !allowedRoles.some(role => role.toLowerCase() === user?.role?.toLowerCase())) {
      return user?.role === 'ADMIN' ? '/admin' : '/';
    }
    return null;
  }, [isAuthenticated, token, requiresAuth, allowedRoles, user?.role]);

  console.log('AppRoute state:', { user, isAuthenticated, loading, token, allowedRoles, userRole: user?.role, redirectPath })

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

  // Redirect if needed
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />
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