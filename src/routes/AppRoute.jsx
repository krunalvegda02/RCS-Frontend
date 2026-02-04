import React, { Suspense, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

const AppRoute = ({ children, allowedRoles, requiresAuth = true, skipOnboardingCheck = false }) => {
  const { user, isAuthenticated, loading, token } = useSelector(state => state.auth)
  const location = useLocation()
  const currentPath = location.pathname

  // Paths that don't require onboarding status check
  const onboardingExemptPaths = ['/onboarding', '/pending-approval', '/login', '/register']
  const isExemptPath = onboardingExemptPaths.some(path => currentPath.startsWith(path))

  // Memoize the redirect path to prevent unnecessary re-renders
  const redirectPath = useMemo(() => {
    // For public routes, no redirect needed
    if (!requiresAuth) return null;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !token) return '/login?reason=unauthorized';

    // Role-based access control
    if (allowedRoles && !allowedRoles.some(role => role.toLowerCase() === user?.role?.toLowerCase())) {
      return user?.role === 'ADMIN' ? '/admin' : '/dashboard';
    }

    return null;
  }, [isAuthenticated, token, requiresAuth, allowedRoles, user?.role]);

  // Memoize the onboarding redirect path
  const onboardingRedirect = useMemo(() => {
    // Skip onboarding check for exempt paths or if flag is set
    if (!isAuthenticated || !user || isExemptPath || skipOnboardingCheck) return null;

    // Admin users don't need onboarding
    if (user.role === 'ADMIN') return null;

    const status = user.onboardingStatus;
    console.log(status)

    switch (status) {
      case 'PENDING_ONBOARDING':
        // User needs to complete onboarding form
        if (currentPath !== '/onboarding') {
          return '/onboarding';
        }
        break;
      case 'ONBOARDING_SUBMITTED':
        // User waiting for approval
        if (currentPath !== '/pending-approval') {
          return '/pending-approval';
        }
        break;
      case 'REJECTED':
        // User was rejected
        return '/login?reason=rejected';
      case 'VERIFIED':
        // User is fully verified - no redirect needed
        // But if they're on onboarding/pending pages, redirect to dashboard
        if (currentPath === '/onboarding' || currentPath === '/pending-approval') {
          return '/dashboard';
        }
        break;
      default:
        // For existing users without onboardingStatus or unknown status
        // Treat them as verified (backward compatibility)
        if (currentPath === '/onboarding' || currentPath === '/pending-approval') {
          return '/dashboard';
        }
        break;
    }

    return null;
  }, [isAuthenticated, user, isExemptPath, skipOnboardingCheck, currentPath]);

  console.log('AppRoute state:', {
    user: user?.email,
    isAuthenticated,
    loading,
    token: !!token,
    allowedRoles,
    userRole: user?.role,
    onboardingStatus: user?.onboardingStatus,
    redirectPath,
    onboardingRedirect,
    currentPath
  })

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

  // Redirect for authentication/role issues
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />
  }

  // Redirect for onboarding status
  if (onboardingRedirect) {
    return <Navigate to={onboardingRedirect} replace />
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