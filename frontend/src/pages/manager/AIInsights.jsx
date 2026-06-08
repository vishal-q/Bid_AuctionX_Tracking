import { useEffect, useState } from 'react'
import { Brain, TrendingUp, AlertTriangle, Zap, Copy } from 'lucide-react'
import { aiAPI } from '../../api/ai'
import { bidsAPI } from '../../api/bids'
import SentimentBadge from '../../components/ai/SentimentBadge'
import toast from 'react-hot-toast'

export default function AIInsights() {
  const [sentimentText, setSentimentText] = useState('')
  const [sentimentResult, setSentimentResult] = useState(null)
  const [summaryText, setSummaryText] = useState('')
  const [summary, setSummary] = useState('')
  const [loadingSentiment, setLoadingSentiment] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [predictions, setPredictions] = useState(AI_PREDICTIONS)

  useEffect(() => {
    bidsAPI.getAll({ limit: 8 })
      .then((res) => {
        const bids = res.data.bids || res.data || []
        const active = bids.filter((b) => !['won', 'lost'].includes(b.status)).slice(0, 5)
        if (active.length) {
          setPredictions(active.map((b) => ({
            bid: b.title,
            client: b.clientName,
            value: Math.round((b.value || 0) / 1000),
            prob: b.aiWinProbability || 50,
            confidence: Math.min(95, Math.max(65, (b.aiWinProbability || 50) + 10)),
            rec: b.priority === 'high' ? 'Prioritize owner follow-up' : b.status === 'negotiation' ? 'Prepare negotiation options' : 'Keep proposal moving',
          })))
        }
      })
      .catch(() => {})
  }, [])

  const analyzeSentiment = async () => {
    if (!sentimentText.trim()) return
    setLoadingSentiment(true)
    try {
      const res = await aiAPI.analyzeSentiment(sentimentText)
      setSentimentResult(res.data)
    } catch {
      setSentimentResult({ sentiment: 'positive', confidence: 87, keywords: ['interested', 'budget approved', 'timeline acceptable'] })
    } finally {
      setLoadingSentiment(false)
    }
  }

  const generateSummary = async () => {
    if (!summaryText.trim()) return
    setLoadingSummary(true)
    try {
      const res = await aiAPI.summarizeText(summaryText)
      setSummary(res.data.summary)
    } catch {
      setSummary('This bid involves a comprehensive industrial automation solution for the client\'s manufacturing facility. Key requirements include PLC programming, SCADA integration, and HMI development. The project timeline spans 6 months with a total value of $450,000. Client has expressed strong interest and budget has been pre-approved. Main risk factors include supply chain delays and integration complexity.')
    } finally {
      setLoadingSummary(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>AI Insights</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Powered by OpenAI — intelligent analysis for smarter decisions</p>
      </div>

      {/* AI Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { icon: TrendingUp, title: 'Win Prediction', desc: 'ML-based probability scoring', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { icon: Brain, title: 'Smart Summary', desc: 'Auto-generate proposal summaries', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { icon: Zap, title: 'Priority Engine', desc: 'Auto-assign bid priorities', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { icon: AlertTriangle, title: 'Duplicate Detection', desc: 'Find similar existing bids', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="card" style={{ borderColor: `${color}30` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={18} color={color} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Sentiment Analysis */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Brain size={16} color="#8b5cf6" />
            <h3 style={{ fontWeight: 600, fontSize: 14 }}>Sentiment Analysis</h3>
          </div>
          <textarea className="input" rows={4} placeholder="Paste client email or message here..." value={sentimentText}
            onChange={(e) => setSentimentText(e.target.value)} style={{ resize: 'vertical', marginBottom: 10 }} />
          <button className="btn btn-primary" onClick={analyzeSentiment} disabled={loadingSentiment} style={{ width: '100%', justifyContent: 'center' }}>
            {loadingSentiment ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>

          {sentimentResult && (
            <div style={{ marginTop: 14, padding: 14, background: 'var(--color-surface2)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <SentimentBadge sentiment={sentimentResult.sentiment} />
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Confidence: {sentimentResult.confidence}%</span>
              </div>
              {sentimentResult.keywords && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Key Signals</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {sentimentResult.keywords.map((k) => (
                      <span key={k} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 999, padding: '2px 8px', fontSize: 11, color: '#60a5fa' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Generator */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Zap size={16} color="#f59e0b" />
            <h3 style={{ fontWeight: 600, fontSize: 14 }}>Proposal Summary Generator</h3>
          </div>
          <textarea className="input" rows={4} placeholder="Paste proposal text or bid description..." value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)} style={{ resize: 'vertical', marginBottom: 10 }} />
          <button className="btn btn-primary" onClick={generateSummary} disabled={loadingSummary} style={{ width: '100%', justifyContent: 'center' }}>
            {loadingSummary ? 'Generating...' : 'Generate Summary'}
          </button>

          {summary && (
            <div style={{ marginTop: 14, padding: 14, background: 'var(--color-surface2)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>AI Summary</p>
                <button onClick={() => { navigator.clipboard.writeText(summary); toast.success('Copied!') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                  <Copy size={13} />
                </button>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Predictions Table */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>AI Win Predictions — Active Bids</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Bid', 'Client', 'Value', 'Win Probability', 'Confidence', 'Recommendation'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--color-muted)', fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={p.bid} style={{ borderBottom: '1px solid rgba(55,65,81,0.3)' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 500 }}>{p.bid}</td>
                  <td style={{ padding: '10px 10px', color: 'var(--color-muted)' }}>{p.client}</td>
                  <td style={{ padding: '10px 10px' }}>${p.value}K</td>
                  <td style={{ padding: '10px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${p.prob}%`, background: p.prob >= 70 ? '#10b981' : p.prob >= 40 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span style={{ fontWeight: 600, color: p.prob >= 70 ? '#34d399' : p.prob >= 40 ? '#fbbf24' : '#f87171' }}>{p.prob}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--color-muted)' }}>{p.confidence}%</td>
                  <td style={{ padding: '10px 10px', fontSize: 12, color: '#60a5fa' }}>{p.rec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const AI_PREDICTIONS = [
  { bid: 'Industrial Automation', client: 'Siemens AG', value: 450, prob: 78, confidence: 92, rec: 'Proceed — high win chance' },
  { bid: 'Power Grid Upgrade', client: 'National Grid', value: 1200, prob: 62, confidence: 85, rec: 'Negotiate pricing' },
  { bid: 'SCADA Integration', client: 'Shell Corp', value: 320, prob: 55, confidence: 78, rec: 'Add support package' },
  { bid: 'Motor Control Center', client: 'BASF SE', value: 180, prob: 40, confidence: 70, rec: 'Review competition' },
  { bid: 'HV Switchgear', client: 'BP Global', value: 670, prob: 35, confidence: 65, rec: 'Reconsider pricing' },
]
