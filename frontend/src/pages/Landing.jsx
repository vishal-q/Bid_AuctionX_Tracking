import { useNavigate } from 'react-router-dom'
import { TrendingUp, Brain, BarChart2, Shield, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react'

const FEATURES = [
  { icon: Brain, title: 'AI Win Prediction', desc: 'ML-powered probability scoring for every bid', color: '#8b5cf6' },
  { icon: BarChart2, title: 'Advanced Analytics', desc: 'Real-time dashboards with revenue insights', color: '#3b82f6' },
  { icon: Zap, title: 'Smart Automation', desc: 'Auto-assign priorities and generate summaries', color: '#f59e0b' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Secure RBAC for clients, employees & managers', color: '#10b981' },
  { icon: Users, title: 'Team Collaboration', desc: 'Live comments, assignments and activity feeds', color: '#06b6d4' },
  { icon: TrendingUp, title: 'Lifecycle Tracking', desc: 'Full bid journey from enquiry to order won', color: '#ef4444' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'rgba(10,14,26,0.9)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.5))' }}>BidNova AuctionX</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 40px 60px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 500, height: 500, background: 'rgba(59,130,246,0.04)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 400, height: 400, background: 'rgba(139,92,246,0.04)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 999, padding: '4px 14px', fontSize: 12, color: '#60a5fa', marginBottom: 20 }}>
          <Zap size={12} /> AI-Powered Industrial Platform
        </div>

        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, maxWidth: 700, margin: '0 auto 20px' }}>
          Intelligent{' '}
          <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bid Lifecycle</span>
          {' '}Management
        </h1>

        <p style={{ fontSize: 18, color: 'var(--color-muted)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          From client enquiry to order won — track, analyze, and win more bids with AI-powered insights and automation.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ fontSize: 15, padding: '12px 28px' }}>
            Start Free Trial <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: 15, padding: '12px 28px' }}>
            View Demo
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
          {[['47%', 'Avg Win Rate'], ['$2.8M', 'Revenue Tracked'], ['142+', 'Bids Managed'], ['12', 'Team Members']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 700, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</p>
              <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 10 }}>Everything you need to win more bids</h2>
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginBottom: 40 }}>Enterprise-grade tools for industrial bid management</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card" style={{ borderColor: `${color}20` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.transform = 'translateY(0)' }}
              style={{ transition: 'all 0.2s', cursor: 'default', borderColor: `${color}20` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '60px 40px', borderTop: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to transform your bid process?</h2>
        <p style={{ color: 'var(--color-muted)', marginBottom: 24 }}>Join industrial companies using BidNova AuctionX Tracking to win more business</p>
        <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ fontSize: 15, padding: '12px 32px' }}>
          Get Started Free <ArrowRight size={16} />
        </button>
      </section>

      <footer style={{ textAlign: 'center', padding: '20px 40px', borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: 13 }}>
        © 2026 BidNova AuctionX Tracking · Industrial Bid Lifecycle Management Platform
      </footer>
    </div>
  )
}
