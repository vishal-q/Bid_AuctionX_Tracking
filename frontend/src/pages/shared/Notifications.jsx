import { useEffect, useMemo, useState } from 'react'
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react'
import { notificationsAPI } from '../../api/notifications'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const TYPE_COLORS = {
  success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', dot: '#10b981' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', dot: '#3b82f6' },
  danger: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', dot: '#ef4444' },
}

function normalizeNotifs(data) {
  const list = data?.data ?? data
  if (!Array.isArray(list)) return []
  return list.map((n) => ({
    _id: n._id ?? n.id,
    title: n.title ?? n.subject ?? 'Notification',
    message: n.message ?? n.body ?? '',
    type: n.type ?? 'info',
    read: Boolean(n.read),
    createdAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
  }))
}

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    notificationsAPI.getAll()
      .then((res) => {
        if (!mounted) return
        setNotifs(normalizeNotifs(res))
      })
      .catch(() => {
        if (!mounted) return
        setNotifs([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const unread = useMemo(() => notifs.filter((n) => !n.read).length, [notifs])

  const markRead = async (id) => {
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    try {
      setActionLoading(true)
      await notificationsAPI.markRead(id)
    } catch {
      toast.error('Failed to mark as read')
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, read: false } : n)))
    } finally {
      setActionLoading(false)
    }
  }

  const markAllRead = async () => {
    if (notifs.length === 0) return
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      setActionLoading(true)
      await notificationsAPI.markAllRead()
      toast.success('All notifications marked read')
    } catch {
      toast.error('Failed to mark all read')
      setNotifs((prev) => prev.map((n) => ({ ...n, read: false })))
    } finally {
      setActionLoading(false)
    }
  }

  const remove = async (id) => {
    setNotifs((prev) => prev.filter((n) => n._id !== id))
    try {
      setActionLoading(true)
      await notificationsAPI.delete(id)
    } catch {
      toast.error('Failed to delete notification')
      // reload list best-effort
      try {
        const res = await notificationsAPI.getAll()
        setNotifs(normalizeNotifs(res))
      } catch {}
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Notifications</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{loading ? 'Loading...' : `${unread} unread notifications`}</p>
        </div>
        {unread > 0 && (
          <button
            className="btn btn-secondary"
            onClick={markAllRead}
            style={{ fontSize: 12 }}
            disabled={actionLoading}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map((n) => {
            const c = TYPE_COLORS[n.type] || TYPE_COLORS.info
            return (
              <div key={n._id} className="card animate-fade-in" style={{
                borderColor: n.read ? 'var(--color-border)' : c.border,
                background: n.read ? 'var(--color-surface)' : c.bg,
                opacity: n.read ? 0.7 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{n.title}</p>
                      <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 10 }}>
                    {!n.read && (
                      <button
                        onClick={() => markRead(n._id)}
                        disabled={actionLoading}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}
                        title="Mark read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => remove(n._id)}
                      disabled={actionLoading}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {notifs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
              <Bell size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p>No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

