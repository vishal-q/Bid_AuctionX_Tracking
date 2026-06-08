import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react'

const STAGES = [
  { key: 'new',                label: 'Enquiry' },
  { key: 'under_review',       label: 'Review' },
  { key: 'proposal_generated', label: 'Proposal' },
  { key: 'awaiting_approval',  label: 'Approval' },
  { key: 'negotiation',        label: 'Negotiation' },
  { key: 'approved',           label: 'Approved' },
  { key: 'won',                label: 'Won' },
]

const STAGE_ORDER = STAGES.map((s) => s.key)

// Map edge-case statuses to their closest stage index
const STATUS_MAP = {
  new:                 0,
  under_review:        1,
  proposal_generated:  2,
  awaiting_approval:   3,
  negotiation:         4,
  approved:            5,
  won:                 6,
  lost:                -2,   // special — show all grey + red X at end
}

export default function BidTimeline({ currentStatus }) {
  const status = currentStatus?.toLowerCase().replace(/ /g, '_') || 'new'
  const isLost = status === 'lost'
  const currentIdx = STATUS_MAP[status] ?? 0

  return (
    <div style={{ overflowX: 'auto', padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 480 }}>
        {STAGES.map((stage, idx) => {
          const done   = !isLost && idx < currentIdx
          const active = !isLost && idx === currentIdx
          const lost   = isLost

          // Colors
          const circleColor  = done ? '#10b981' : active ? '#3b82f6' : lost ? '#6b7280' : 'var(--color-surface2)'
          const borderColor  = done ? '#10b981' : active ? '#3b82f6' : lost ? '#4b5563' : 'var(--color-border)'
          const labelColor   = done ? '#34d399' : active ? '#60a5fa' : 'var(--color-muted)'
          const lineColor    = done ? '#10b981' : 'var(--color-border)'

          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 70 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: circleColor,
                  border: `2px solid ${borderColor}`,
                  transition: 'all 0.3s',
                }}>
                  {done   && <CheckCircle size={15} color="white" />}
                  {active && <Clock size={15} color="white" />}
                  {!done && !active && <Circle size={15} color={lost ? '#6b7280' : 'var(--color-muted)'} />}
                </div>
                <p style={{
                  fontSize: 10, marginTop: 5, textAlign: 'center', whiteSpace: 'nowrap',
                  color: labelColor, fontWeight: active ? 600 : 400,
                }}>
                  {stage.label}
                </p>
              </div>

              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div style={{
                  height: 2, flex: 1,
                  background: lineColor,
                  transition: 'background 0.3s',
                  marginBottom: 18,
                }} />
              )}
            </div>
          )
        })}

        {/* Lost indicator — shown after all stages */}
        {isLost && (
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 70 }}>
            <div style={{ height: 2, flex: 1, background: '#ef4444', marginBottom: 18 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(239,68,68,0.15)',
                border: '2px solid #ef4444',
              }}>
                <XCircle size={15} color="#ef4444" />
              </div>
              <p style={{ fontSize: 10, marginTop: 5, color: '#f87171', fontWeight: 600, textAlign: 'center' }}>Lost</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
