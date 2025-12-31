import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthChecker from './components/AuthChecker'
import { Toaster } from 'react-hot-toast'
import ReduxProvider from './components/ReduxProvider.jsx'
import AppRoute from './routes/AppRoute.jsx'
import { pageData } from './data/pageData'

function App() {
  return (
    <ReduxProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <AuthChecker />
        <Routes>
          {/* Public routes */}
          {pageData.public.map(({ path, component: Component }) => (
            <Route 
              key={path} 
              path={path} 
              element={
                <AppRoute requiresAuth={false}>
                  <Component />
                </AppRoute>
              } 
            />
          ))}

          {/* User routes */}
          {pageData.user.map(({ path, layout: Layout, allowedRoles, children }) => (
            <Route 
              key={path} 
              path={path} 
              element={
                <AppRoute allowedRoles={allowedRoles}>
                  <Layout />
                </AppRoute>
              }
            >
              {children.map(({ path: childPath, component: Component, index }) => (
                <Route 
                  key={index ? 'index' : childPath}
                  {...(index ? { index: true } : { path: childPath })}
                  element={<Component />} 
                />
              ))}
            </Route>
          ))}

          {/* Admin routes */}
          {pageData.admin.map(({ path, layout: Layout, allowedRoles, children }) => (
            <Route 
              key={path} 
              path={path} 
              element={
                <AppRoute allowedRoles={allowedRoles}>
                  <Layout />
                </AppRoute>
              }
            >
              {children.map(({ path: childPath, component: Component, index }) => (
                <Route 
                  key={index ? 'index' : childPath}
                  {...(index ? { index: true } : { path: childPath })}
                  element={<Component />} 
                />
              ))}
            </Route>
          ))}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ReduxProvider>
  )
}

export default App



