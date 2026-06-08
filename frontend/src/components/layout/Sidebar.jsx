import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useLanguageStore } from '../../store/languageStore'
import { getT } from '../../i18n'
import {
  LayoutDashboard, FileText, BarChart2, Bell, User, LogOut,
  Users, Settings, Brain, TrendingUp, Briefcase, Download, Activity, Map, CreditCard, Code2
} from 'lucide-react'

const ROLE_LINKS = {
  CLIENT: [
    { to: '/client', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/client/bids', icon: FileText, labelKey: 'myBids' },
    { to: '/client/map', icon: Map, labelKey: 'liveMap' },
    { to: '/client/subscription', icon: CreditCard, labelKey: 'subscription' },
    { to: '/client/notifications', icon: Bell, labelKey: 'notifications' },
    { to: '/client/profile', icon: User, labelKey: 'profile' },
  ],
  EMPLOYEE: [
    { to: '/employee', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/employee/bids', icon: Briefcase, labelKey: 'assignedBids' },
    { to: '/employee/devtools', icon: Code2, labelKey: 'devTools' },
    { to: '/employee/map', icon: Map, labelKey: 'liveMap' },
    { to: '/employee/subscription', icon: CreditCard, labelKey: 'subscription' },
    { to: '/employee/notifications', icon: Bell, labelKey: 'notifications' },
    { to: '/employee/profile', icon: User, labelKey: 'profile' },
  ],
  MANAGER: [
    { to: '/manager', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/manager/bids', icon: FileText, labelKey: 'allBids' },
    { to: '/manager/analytics', icon: BarChart2, labelKey: 'analytics' },
    { to: '/manager/reports', icon: Download, labelKey: 'reports' },
    { to: '/manager/activity', icon: Activity, labelKey: 'activityFeed' },
    { to: '/manager/map', icon: Map, labelKey: 'liveMap' },
    { to: '/manager/team', icon: Users, labelKey: 'team' },
    { to: '/manager/employees', icon: Briefcase, labelKey: 'employees' },
    { to: '/manager/clients', icon: User, labelKey: 'clients' },
    { to: '/manager/ai', icon: Brain, labelKey: 'aiInsights' },
    { to: '/manager/notifications', icon: Bell, labelKey: 'notifications' },
    { to: '/manager/settings', icon: Settings, labelKey: 'settings' },
    { to: '/manager/subscription', icon: CreditCard, labelKey: 'subscription' },
    { to: '/manager/profile', icon: User, labelKey: 'profile' },
  ],
  ADMIN: [
    { to: '/manager', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/manager/bids', icon: FileText, labelKey: 'allBids' },
    { to: '/manager/analytics', icon: BarChart2, labelKey: 'analytics' },
    { to: '/manager/reports', icon: Download, labelKey: 'reports' },
    { to: '/manager/activity', icon: Activity, labelKey: 'activityFeed' },
    { to: '/manager/map', icon: Map, labelKey: 'liveMap' },
    { to: '/manager/team', icon: Users, labelKey: 'team' },
    { to: '/manager/employees', icon: Briefcase, labelKey: 'employees' },
    { to: '/manager/clients', icon: User, labelKey: 'clients' },
    { to: '/manager/ai', icon: Brain, labelKey: 'aiInsights' },
    { to: '/manager/notifications', icon: Bell, labelKey: 'notifications' },
    { to: '/manager/settings', icon: Settings, labelKey: 'settings' },
    { to: '/manager/subscription', icon: CreditCard, labelKey: 'subscription' },
    { to: '/manager/profile', icon: User, labelKey: 'profile' },
  ],
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { language } = useLanguageStore()
  const t = getT(language)
  const navigate = useNavigate()
  const links = ROLE_LINKS[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{
      width: collapsed ? 60 : 220, height: '100vh', background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s ease', position: 'fixed', top: 0, left: 0, zIndex: 100, overflow: 'hidden'
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={16} color="white" />
        </div>
        {!collapsed && <span style={{
          fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap',
          background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.5))',
          letterSpacing: '0.3px',
        }}>BidNova AuctionX</span>}
      </div>

      {/* User info */}
      {!collapsed && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'white', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links — scrollable */}
      <nav style={{
        flex: 1,
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
      }}>
        {links.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} end={to.split('/').length <= 2}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', position: 'relative' }}
            title={collapsed ? t(labelKey) : ''}>
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ flex: 1 }}>{t(labelKey)}</span>}
            {/* Notification badge on Bell link */}
            {labelKey === 'notifications' && unreadCount > 0 && (
              <span style={{
                minWidth: 18, height: 18, background: '#ef4444', borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white', padding: '0 4px',
                marginLeft: collapsed ? 0 : 'auto',
                position: collapsed ? 'absolute' : 'static',
                top: collapsed ? 4 : 'auto', right: collapsed ? 4 : 'auto',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout — always fixed at bottom */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--color-surface)' }}>
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
          title={collapsed ? t('logout') : ''}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
