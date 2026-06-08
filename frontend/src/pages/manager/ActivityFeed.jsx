import { useEffect, useState } from 'react'
import { Activity, RefreshCw, Filter } from 'lucide-react'
import { bidsAPI } from '../../api/bids'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const ACTION_COLORS = {
  created:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: '➕' },
  assigned:   { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '👷' },
  status:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🔄' },
  verified:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
  rejected:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '❌' },
  completed:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '🎉' },
  submitted:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  icon: '📤' },
  document:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: '📎' },
  progress:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: '📊' },
  default:    { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', icon: '•' },
}

function getActionType(action = '') {
  const a = action.toLowerCase()
  if (a.includes('created') || a.includes('bid created')) return 'created'
  if (a.includes('assigned')) return 'assigned'
  if (a.includes('verified')) return 'verified'
  if (a.includes('rejected')) return 'rejected'
  if (a.includes('completed') || a.includes('approved')) return 'completed'
  if (a.includes('submitted')) return 'submitted'
  if (a.includes('document')) return 'document'
  if (a.includes('progress')) return 'progress'
  if (a.includes('status')) return 'status'
  return 'default'
}

export default function ActivityFeed() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activities, setActivities] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await bidsAPI.getAll({ limit: 100, sort: '-updatedAt' })
      const allBids = res.data?.bids || res.data || []
      setBids(allBids)
      // Flatten all history entries from all bids
      const flat = []
      allBids.forEach((bid) => {
        (bid.history || []).forEach((h) => {
          flat.push({
            id: `${bid._id}-${h.timestamp || h._id}`,
            bidId: bid._id,
            bidTitle: bid.title,
            bidNumber: bid.bidNumber,
            action: h.action,
            userName: h.userName || h.user?.name || 'System',
            timestamp: h.timestamp || bid.updatedAt,
            type: getActionType(h.action),
          })
        })
      })
      // Sort by timestamp desc
      flat.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setActivities(flat.slice(0, 200))
    } catch { setActivities([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? activities : activities.filter((a) => a.type === filter)

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Activity Feed</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{filtered.length} activities across all bids</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={13} style={{ color: 'var(--color-muted)' }} />
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ height: 34, width: 160, fontSize: 13 }}>
            <option value="all">All Activities</option>
            <option value="created">Created</option>
            <option value="assigned">Assigned</option>
            <option value="status">Status Changes</option>
            <option value="verified">Verified</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="document">Documents</option>
          </select>
          <button className="btn btn-secondary" onClick={load} style={{ height: 34 }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>
            <Activity size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>No activities found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((act, i) => {
              const cfg = ACTION_COLORS[act.type] || ACTION_COLORS.default
              return (
                <div key={act.id} style={{
                  display: 'flex', gap: 14, padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, marginTop: 2 }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: cfg.color }}>{act.userName}</span>
                      {' — '}
                      <span>{act.action}</span>
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#60a5fa', background: 'rgba(59,130,246,0.08)', padding: '1px 8px', borderRadius: 999 }}>
                        {act.bidNumber || act.bidTitle}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                        {timeAgo(act.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 4 }}>
                    {new Date(act.timestamp).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
