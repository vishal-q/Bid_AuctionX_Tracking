import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { getT } from '../../i18n'

// Map URL segments to translation keys
const SEGMENT_MAP = {
  manager: 'dashboard',
  client: 'dashboard',
  employee: 'dashboard',
  bids: 'allBids',
  analytics: 'analytics',
  reports: 'reports',
  activity: 'activityFeed',
  map: 'liveMap',
  subscription: 'subscription',
  devtools: 'devTools',
  team: 'team',
  employees: 'employees',
  clients: 'clients',
  ai: 'aiInsights',
  notifications: 'notifications',
  settings: 'settings',
  profile: 'profile',
}

// Role badge colors
const ROLE_STYLES = {
  MANAGER:  { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa',  border: 'rgba(59,130,246,0.3)'  },
  ADMIN:    { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa',  border: 'rgba(139,92,246,0.3)'  },
  EMPLOYEE: { bg: 'rgba(16,185,129,0.15)',  color: '#34d399',  border: 'rgba(16,185,129,0.3)'  },
  CLIENT:   { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24',  border: 'rgba(245,158,11,0.3)'  },
}

export default function BreadcrumbNav({ sidebarWidth = 220 }) {
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const t = getT(language)
  const location = useLocation()
  const navigate = useNavigate()

  const role = user?.role || 'CLIENT'
  const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.CLIENT
  const roleLabel = t(role.toLowerCase())

  // Build breadcrumb from pathname
  const segments = location.pathname.split('/').filter(Boolean)

  // Build crumbs — skip the role segment (first), treat it as Home
  const crumbs = []

  // Home crumb (role dashboard)
  const homeBase = '/' + (segments[0] || '')
  crumbs.push({
    label: t('home'),
    path: homeBase,
    isHome: true,
  })

  // Remaining segments
  segments.slice(1).forEach((seg, idx) => {
    const path = '/' + segments.slice(0, idx + 2).join('/')
    // If it looks like a MongoDB ID (24 hex chars), show "Bid Detail"
    const isId = /^[a-f0-9]{24}$/i.test(seg)
    const label = isId ? t('bidDetail') : (t(SEGMENT_MAP[seg] || seg))
    crumbs.push({ label, path, isId })
  })

  // Don't show breadcrumb if only home
  if (crumbs.length <= 1) return (
    <RoleBadge role={role} roleLabel={roleLabel} roleStyle={roleStyle} sidebarWidth={sidebarWidth} />
  )

  return (
    <div style={{
      position: 'fixed',
      top: 56,
      left: sidebarWidth,
      right: 0,
      height: 36,
      zIndex: 98,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      transition: 'left 0.3s ease',
    }}>
      {/* Breadcrumb trail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {crumbs.map((crumb, idx) => (
          <div key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {idx > 0 && <ChevronRight size={12} color="var(--color-muted)" />}
            {idx === crumbs.length - 1 ? (
              // Current page — not clickable
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: 'var(--color-text)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {crumb.isHome && <Home size={11} />}
                {crumb.label}
              </span>
            ) : (
              // Clickable crumb
              <button
                onClick={() => navigate(crumb.path)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'var(--color-muted)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: 0, transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#60a5fa'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
              >
                {crumb.isHome && <Home size={11} />}
                {crumb.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Role badge */}
      <RoleBadge role={role} roleLabel={roleLabel} roleStyle={roleStyle} inline />
    </div>
  )
}

function RoleBadge({ role, roleLabel, roleStyle, sidebarWidth, inline }) {
  if (inline) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 10px',
        borderRadius: 999, letterSpacing: '0.5px',
        background: roleStyle.bg, color: roleStyle.color,
        border: `1px solid ${roleStyle.border}`,
      }}>
        {role}
      </span>
    )
  }

  // Standalone bar (when on home/dashboard — no breadcrumb trail)
  return (
    <div style={{
      position: 'fixed',
      top: 56,
      left: sidebarWidth,
      right: 0,
      height: 36,
      zIndex: 98,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      transition: 'left 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Home size={12} color="var(--color-muted)" />
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{roleLabel} Dashboard</span>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 10px',
        borderRadius: 999, letterSpacing: '0.5px',
        background: roleStyle.bg, color: roleStyle.color,
        border: `1px solid ${roleStyle.border}`,
      }}>
        {role}
      </span>
    </div>
  )
}
