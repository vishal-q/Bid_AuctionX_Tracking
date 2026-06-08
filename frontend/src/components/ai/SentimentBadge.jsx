import { Smile, Meh, Frown } from 'lucide-react'

export default function SentimentBadge({ sentiment }) {
  const map = {
    positive: { icon: Smile, color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Positive' },
    neutral: { icon: Meh, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Neutral' },
    negative: { icon: Frown, color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Negative' },
  }
  const s = map[sentiment?.toLowerCase()] || map.neutral
  const Icon = s.icon

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '4px 10px' }}>
      <Icon size={13} color={s.color} />
      <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.label}</span>
    </div>
  )
}
