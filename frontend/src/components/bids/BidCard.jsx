import { Calendar, User, DollarSign, TrendingUp, MessageSquare } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'
import { DiscussionModal } from './DiscussionModal'

export default function BidCard({ bid, selectable = false, selected = false, onSelect }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const role = user?.role?.toLowerCase()
  const [showDiscussion, setShowDiscussion] = useState(false)
  
  // Check if user can access discussion
  const canAccessDiscussion = (
    (user?.role === 'CLIENT' && user?.id === bid.clientId) ||
    (user?.role === 'EMPLOYEE' && user?.id === bid.assignedTo?.id) ||
    (user?.role === 'MANAGER' && bid.assignedTo)
  )

  const handleClick = () => navigate(`/${role}/bids/${bid._id}`)

  return (
    <div className="card animate-fade-in" style={{ cursor: 'pointer', transition: 'all 0.2s', borderColor: 'var(--color-border)' }}
      onClick={handleClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onSelect?.(bid._id, e.target.checked)}
              style={{ marginBottom: 8, accentColor: '#3b82f6' }}
            />
          )}
          <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>#{bid.bidNumber || bid._id?.slice(-6)}</p>
          <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{bid.title}</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <StatusBadge status={bid.status} />
            <PriorityBadge priority={bid.priority} />
          </div>
        </div>
        {bid.aiWinProbability !== undefined && (
          <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 10px', marginLeft: 10 }}>
            <TrendingUp size={12} color="#34d399" style={{ marginBottom: 2 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>{bid.aiWinProbability}%</p>
            <p style={{ fontSize: 9, color: 'var(--color-muted)' }}>Win Prob</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: 12 }}>
          <User size={12} />
          <span>{bid.clientName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: 12 }}>
          <DollarSign size={12} />
          <span>{bid.value ? `$${bid.value.toLocaleString()}` : 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: 12 }}>
          <Calendar size={12} />
          <span>{bid.deadline ? new Date(bid.deadline).toLocaleDateString() : 'No deadline'}</span>
        </div>
        {bid.assignedTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: 12 }}>
            <User size={12} />
            <span>{bid.assignedTo?.name || 'Unassigned'}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {bid.progress !== undefined && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Progress</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{bid.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${bid.progress}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
          </div>
        </div>
      )}

      {/* Discussion Button */}
      {canAccessDiscussion && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowDiscussion(true)
          }}
          style={{
            marginTop: 12,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 6,
            color: '#3b82f6',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
          }}
        >
          <MessageSquare size={14} />
          Discuss Project
        </button>
      )}

      {/* Discussion Modal */}
      {showDiscussion && <DiscussionModal bidId={bid._id} onClose={() => setShowDiscussion(false)} />}
    </div>
  )
}
