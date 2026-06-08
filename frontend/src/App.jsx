import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import { LoginWrapper, RegisterWrapper } from './pages/auth/_AuthWrappers'
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess'
import OtpVerify from './pages/auth/OtpVerify'

// Landing
import Landing from './pages/Landing'

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard'
import BidsManagement from './pages/manager/BidsManagement'
import BidDetail from './pages/manager/BidDetail'
import Analytics from './pages/manager/Analytics'
import AIInsights from './pages/manager/AIInsights'
import Team from './pages/manager/Team'
import Employees from './pages/manager/Employees'
import Clients from './pages/manager/Clients'
import Reports from './pages/manager/Reports'
import Settings from './pages/manager/Settings'
import ActivityFeed from './pages/manager/ActivityFeed'
import LiveMap from './pages/manager/LiveMap'
import Subscription from './pages/shared/Subscription'

// Client pages
import ClientDashboard from './pages/client/ClientDashboard'

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import DevTools from './pages/employee/DevTools'

// Shared pages
import Notifications from './pages/shared/Notifications'
import Profile from './pages/shared/Profile'

// AI Chat
import AIChatWidget from './components/ai/AIChatWidget'

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { theme, initTheme } = useThemeStore()

  useEffect(() => { initTheme() }, [initTheme])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: theme === 'dark' ? '#1f2937' : '#ffffff',
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          border: theme === 'dark' ? '1px solid #374151' : '1px solid #d6deea',
          fontSize: 13
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#f9fafb' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
      }} />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={
          <LoginWrapper isAuthenticated={isAuthenticated} user={user} />
        } />
        <Route path="/register" element={
          <RegisterWrapper isAuthenticated={isAuthenticated} user={user} />
        } />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/verify-otp" element={<OtpVerify />} />

        {/* Manager / Admin */}
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ManagerDashboard />} />
          <Route path="bids" element={<BidsManagement />} />
          <Route path="bids/:id" element={<BidDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai" element={<AIInsights />} />
          <Route path="team" element={<Team />} />
          <Route path="employees" element={<Employees />} />
          <Route path="clients" element={<Clients />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="activity" element={<ActivityFeed />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>

        {/* Client */}
        <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ClientDashboard />} />
          <Route path="bids" element={<BidsManagement />} />
          <Route path="bids/:id" element={<BidDetail />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>

        {/* Employee */}
        <Route path="/employee" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="bids" element={<BidsManagement />} />
          <Route path="bids/:id" element={<BidDetail />} />
          <Route path="devtools" element={<DevTools />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Chat Widget — shown when authenticated */}
      {isAuthenticated && <AIChatWidget />}
    </BrowserRouter>
  )
}

function getDefaultPath(role) {
  if (role === 'CLIENT') return '/client'
  if (role === 'EMPLOYEE') return '/employee'
  return '/manager'
}
