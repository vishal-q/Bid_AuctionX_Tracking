import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const QUICK_PROMPTS = [
  'Show pending bids',
  'Which bids are high priority?',
  'Total revenue',
  'Bids in negotiation',
]

// Smart offline responses when backend not reachable
const OFFLINE_RESPONSES = {
  'pending': '📋 Checking pending bids... Backend not reachable. Start backend with: node server.js',
  'high priority': '🔴 High priority bids: Industrial Automation (Siemens), Power Grid Upgrade (National Grid), HV Switchgear (BP Global)',
  'won': '🏆 Won bids: Transformer Maintenance Contract (EDF Energy) — $95,000',
  'revenue': '💰 Total revenue from won bids: $95,000 (demo data)',
  'negotiation': '🤝 Bids in negotiation: Industrial Automation System — Siemens AG ($450,000)',
  'total': '📊 Total bids: 8 | Won: 1 | Lost: 1 | Active: 6',
  'lost': '❌ Lost bids: Energy Management System — Reliance Industries ($890,000)',
  'approval': '⏳ Awaiting approval: Power Grid Upgrade — National Grid ($1,200,000)',
}

function getOfflineReply(msg) {
  const lower = msg.toLowerCase()
  for (const [key, reply] of Object.entries(OFFLINE_RESPONSES)) {
    if (lower.includes(key)) return reply
  }
  return `I can answer questions about your bids! Try:\n• "Show pending bids"\n• "Which bids are high priority?"\n• "Total revenue"\n• "Bids in negotiation"\n\n💡 Make sure backend is running on port 8080 for live data.`
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your BidNova AuctionX AI assistant. Ask me anything about your bids." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const { token } = useAuthStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      const res = await fetch(
        (import.meta.env.VITE_API_URL || 'http://localhost:8080/api') + '/ai/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: msg }),
          signal: AbortSignal.timeout(8000),
        }
      )

      if (res.ok) {
        const data = await res.json()
        const reply = data.reply || data.message || 'No response'
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
      } else if (res.status === 401) {
        // Auth failed — use offline smart reply
        setMessages((prev) => [...prev, { role: 'assistant', text: getOfflineReply(msg) }])
      } else {
        throw new Error('Server error')
      }
    } catch (err) {
      // Network error or timeout — use offline smart reply
      setMessages((prev) => [...prev, { role: 'assistant', text: getOfflineReply(msg) }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 52, height: 52,
          borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 200, boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <X size={20} color="white" /> : <MessageSquare size={20} color="white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="glass animate-fade-in"
          style={{
            position: 'fixed', bottom: 88, right: 24, width: 340, height: 460,
            zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>BidNova AuctionX AI</p>
              <p style={{ fontSize: 10, color: '#34d399' }}>● Online</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={12} color="white" />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'var(--color-surface2)',
                  fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={12} color="white" />
                </div>
                <div style={{ background: 'var(--color-surface2)', padding: '8px 14px', borderRadius: '12px 12px 12px 2px', fontSize: 13, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ animation: 'pulse-dot 1s infinite', display: 'inline-block' }}>●</span>
                  <span style={{ animation: 'pulse-dot 1s infinite 0.2s', display: 'inline-block' }}>●</span>
                  <span style={{ animation: 'pulse-dot 1s infinite 0.4s', display: 'inline-block' }}>●</span>
                  <style>{`@keyframes pulse-dot { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '6px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                style={{
                  background: 'var(--color-surface2)', border: '1px solid var(--color-border)',
                  borderRadius: 999, padding: '3px 10px', fontSize: 11, color: 'var(--color-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#60a5fa' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted)' }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
              placeholder="Ask about bids..."
              style={{ flex: 1, height: 34, fontSize: 13 }}
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0 12px', height: 34 }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
