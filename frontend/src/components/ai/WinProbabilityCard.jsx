import { TrendingUp, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { aiAPI } from '../../api/ai'

export default function WinProbabilityCard({ bidId, initialProb }) {
  const [prob, setProb] = useState(initialProb)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await aiAPI.predictWinProbability(bidId)
      setProb(res.data.probability)
    } catch { /* use cached */ }
    finally { setLoading(false) }
  }

  const color = prob >= 70 ? '#10b981' : prob >= 40 ? '#f59e0b' : '#ef4444'
  const label = prob >= 70 ? 'High Chance' : prob >= 40 ? 'Moderate' : 'Low Chance'

  return (
    <div className="card glow-green" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} color="#34d399" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>AI Win Prediction</span>
        </div>
        <button onClick={refresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
          <RefreshCw size={14} className={loading ? 'animate-pulse-glow' : ''} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Circular progress */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-surface2)" strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - (prob || 0) / 100)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color }}>{prob ?? '--'}%</span>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Based on historical data & bid parameters</p>
        </div>
      </div>
    </div>
  )
}
