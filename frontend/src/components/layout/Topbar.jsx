import { useEffect, useRef, useState } from 'react'
import { Bell, Menu, Search, Moon, Sun, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useNotificationStore } from '../../store/notificationStore'
import { bidsAPI } from '../../api/bids'
import LanguageSwitcher from '../ui/LanguageSwitcher'

export default function Topbar({ onMenuToggle, sidebarWidth = 220 }) {
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()
  const navigate = useNavigate()
  const role = user?.role?.toLowerCase()
  const notifPath = `/${role}/notifications`

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  // Fetch unread count on mount and every 60s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  // Click outside to close search
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (val) => {
    setQuery(val)
    if (!val.trim()) { setResults([]); setShowResults(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await bidsAPI.getAll({ search: val, limit: 6 })
        const bids = res.data?.bids || res.data || []
        setResults(bids)
        setShowResults(true)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
  }

  const goToBid = (bid) => {
    setQuery('')
    setShowResults(false)
    navigate(`/${role}/bids/${bid._id}`)
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: sidebarWidth, right: 0, height: 56, zIndex: 99,
      background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
      transition: 'left 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenuToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}>
          <Menu size={18} />
        </button>

        {/* Search with dropdown */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search bids..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            style={{ paddingLeft: 32, paddingRight: query ? 28 : 12, width: 240, height: 34, fontSize: 13 }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setShowResults(false) }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 0 }}>
              <X size={12} />
            </button>
          )}

          {/* Search results dropdown */}
          {showResults && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, width: 320, marginTop: 6,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 200, overflow: 'hidden'
            }}>
              {searching && <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--color-muted)' }}>Searching...</p>}
              {!searching && results.length === 0 && <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--color-muted)' }}>No bids found</p>}
              {!searching && results.map((bid) => (
                <div key={bid._id} onClick={() => goToBid(bid)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{bid.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                    #{bid.bidNumber} · {bid.clientName} · <span style={{ textTransform: 'capitalize' }}>{bid.status?.replace(/_/g, ' ')}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 6 }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notification bell with real badge */}
        <button onClick={() => navigate(notifPath)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 6, position: 'relative' }}>
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 1, right: 1,
              minWidth: 16, height: 16, background: '#ef4444', borderRadius: 999,
              border: '1.5px solid var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: 'white', padding: '0 3px'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div
          style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'white', cursor: 'pointer' }}
          onClick={() => navigate(`/${role}/profile`)}
          title={user?.name}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
