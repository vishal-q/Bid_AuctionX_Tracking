import { Navigate, useLocation } from 'react-router-dom'

import Login from './Login'
import Register from './Register'

export function LoginWrapper({ isAuthenticated, user }) {
  const location = useLocation()
  const fromRegister = location.state?.fromRegister

  // After successful registration, we must NOT auto-redirect even if persisted auth exists.
  if (fromRegister) return <Login />

  return isAuthenticated ? <Navigate to={getDefaultPath(user?.role)} replace /> : <Login />
}

export function RegisterWrapper({ isAuthenticated, user }) {
  const location = useLocation()
  const fromRegister = location.state?.fromRegister

  // If user hit /register again right after registration flow, keep them on register.
  if (fromRegister) return <Register />

  return isAuthenticated ? <Navigate to={getDefaultPath(user?.role)} replace /> : <Register />
}

function getDefaultPath(role) {
  if (role === 'CLIENT') return '/client'
  if (role === 'EMPLOYEE') return '/employee'
  return '/manager'
}

