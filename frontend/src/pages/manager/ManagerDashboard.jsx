import { useEffect, useState } from 'react'
import { FileText, TrendingUp, Users, DollarSign, Award, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { bidsAPI } from '../../api/bids'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function ManagerDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [recentBids, setRecentBids] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([bidsAPI.getAnalytics(), bidsAPI.getAll({ limit: 5, sort: '-createdAt' })])
      .then(([a, b]) => {
        setAnalytics(a.data)
        setRecentBids(b.data.bids || b.data || [])
      })
      .catch(() => {
        // Use mock data for demo
        setAnalytics(MOCK_ANALYTICS)
        setRecentBids(MOCK_BIDS)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const stats = analytics?.stats || MOCK_ANALYTICS.stats
  const monthlyData = analytics?.monthly || MOCK_ANALYTICS.monthly
  const statusDist = analytics?.statusDistribution || MOCK_ANALYTICS.statusDistribution
  const activeBids = recentBids.filter((b) => !['won', 'lost'].includes(b.status))
  const approvalQueue = recentBids.filter((b) => b.status === 'awaiting_approval')
  const upcomingDeadlines = [...activeBids]
    .filter((b) => b.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4)
  const forecast = activeBids.reduce((sum, bid) => sum + ((bid.value || 0) * ((bid.aiWinProbability || 50) / 100)), 0)

  // Overdue bids
  const now = new Date()
  const overdueBids = activeBids.filter((b) => b.deadline && new Date(b.deadline) < now)
  const pendingVerification = recentBids.filter((b) => b.verificationStatus === 'pending' || (!b.verificationStatus && b.status === 'new'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Manager Dashboard</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Overview of all bid activities and performance</p>
      </div>

      {/* ── Alert Banners (only shown when needed) ── */}
      {overdueBids.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#f87171', flex: 1 }}>
            <strong>{overdueBids.length} bid{overdueBids.length > 1 ? 's are' : ' is'} overdue</strong> — {overdueBids.slice(0, 2).map(b => b.title).join(', ')}{overdueBids.length > 2 ? ` +${overdueBids.length - 2} more` : ''}
          </p>
          <button className="btn btn-danger" style={{ fontSize: 12, height: 28, padding: '0 12px', flexShrink: 0 }} onClick={() => navigate('/manager/bids')}>
            View All
          </button>
        </div>
      )}

      {pendingVerification.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#fbbf24', flex: 1 }}>
            <strong>{pendingVerification.length} bid{pendingVerification.length > 1 ? 's need' : ' needs'} verification</strong> — review client requirements and approve
          </p>
          <button className="btn btn-secondary" style={{ fontSize: 12, height: 28, padding: '0 12px', flexShrink: 0 }} onClick={() => navigate('/manager/bids')}>
            Review
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard title="Total Bids" value={stats.total} icon={FileText} color="blue" change={12} />
        <StatCard title="Won Bids" value={stats.won} icon={Award} color="green" change={8} />
        <StatCard title="Revenue" value={`$${(stats.revenue / 1000).toFixed(0)}K`} icon={DollarSign} color="purple" change={15} />
        <StatCard title="Win Rate" value={`${stats.winRate}%`} icon={TrendingUp} color="green" />
        <StatCard title="Pending Approval" value={stats.pendingApproval} icon={Clock} color="yellow" />
        <StatCard title="High Priority" value={stats.highPriority} icon={AlertTriangle} color="red" />
      </div>
      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Monthly revenue */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Monthly Revenue & Bids</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bids" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Bid Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {statusDist.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--color-muted)' }}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Win/Loss trend */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Win/Loss Trend</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Upcoming Deadlines</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingDeadlines.map((bid) => (
              <button key={bid._id} onClick={() => navigate(`/manager/bids/${bid._id}`)} style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)', borderRadius: 8, padding: 10, textAlign: 'left', cursor: 'pointer', color: 'var(--color-text)' }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{bid.title}</p>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>{new Date(bid.deadline).toLocaleDateString()} - {bid.clientName}</p>
              </button>
            ))}
            {upcomingDeadlines.length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No active deadlines found.</p>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Approval Queue</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvalQueue.slice(0, 4).map((bid) => (
              <button key={bid._id} onClick={() => navigate(`/manager/bids/${bid._id}`)} style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: 10, textAlign: 'left', cursor: 'pointer', color: 'var(--color-text)' }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{bid.title}</p>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>${bid.value?.toLocaleString()} - {bid.clientName}</p>
              </button>
            ))}
            {approvalQueue.length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No bids awaiting approval.</p>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Weighted Forecast</h3>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#34d399' }}>${Math.round(forecast / 1000)}K</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 6 }}>Active pipeline value weighted by AI win probability.</p>
        </div>
      </div>

      {/* Recent bids */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 600, fontSize: 14 }}>Recent Bids</h3>
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px', height: 30 }} onClick={() => navigate('/manager/bids')}>View All</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Bid', 'Client', 'Value', 'Status', 'Priority', 'Deadline'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--color-muted)', fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBids.map((bid) => (
                <tr key={bid._id} style={{ borderBottom: '1px solid rgba(55,65,81,0.3)', cursor: 'pointer' }}
                  onClick={() => navigate(`/manager/bids/${bid._id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 10px' }}>
                    <p style={{ fontWeight: 500 }}>{bid.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>#{bid.bidNumber || bid._id?.slice(-6)}</p>
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--color-muted)' }}>{bid.clientName}</td>
                  <td style={{ padding: '10px 10px' }}>${bid.value?.toLocaleString() || 'N/A'}</td>
                  <td style={{ padding: '10px 10px' }}><StatusBadge status={bid.status} /></td>
                  <td style={{ padding: '10px 10px' }}><PriorityBadge priority={bid.priority} /></td>
                  <td style={{ padding: '10px 10px', color: 'var(--color-muted)', fontSize: 12 }}>{bid.deadline ? new Date(bid.deadline).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Mock data for demo
const MOCK_ANALYTICS = {
  stats: { total: 142, won: 67, revenue: 2840000, winRate: 47, pendingApproval: 12, highPriority: 8 },
  monthly: [
    { month: 'Jan', revenue: 320, bids: 18, won: 8, lost: 4 },
    { month: 'Feb', revenue: 280, bids: 14, won: 6, lost: 3 },
    { month: 'Mar', revenue: 450, bids: 22, won: 11, lost: 5 },
    { month: 'Apr', revenue: 390, bids: 19, won: 9, lost: 4 },
    { month: 'May', revenue: 520, bids: 26, won: 13, lost: 6 },
    { month: 'Jun', revenue: 480, bids: 23, won: 12, lost: 5 },
  ],
  statusDistribution: [
    { name: 'Won', value: 67 }, { name: 'Lost', value: 28 }, { name: 'Active', value: 31 },
    { name: 'Review', value: 16 },
  ],
}

const MOCK_BIDS = [
  { _id: '1', title: 'Industrial Automation System', clientName: 'Siemens AG', value: 450000, status: 'negotiation', priority: 'high', deadline: '2026-06-15', bidNumber: 'BID-001' },
  { _id: '2', title: 'Power Grid Upgrade', clientName: 'National Grid', value: 1200000, status: 'awaiting_approval', priority: 'high', deadline: '2026-06-20', bidNumber: 'BID-002' },
  { _id: '3', title: 'SCADA System Integration', clientName: 'Shell Corp', value: 320000, status: 'proposal_generated', priority: 'medium', deadline: '2026-07-01', bidNumber: 'BID-003' },
  { _id: '4', title: 'Motor Control Center', clientName: 'BASF SE', value: 180000, status: 'under_review', priority: 'medium', deadline: '2026-07-10', bidNumber: 'BID-004' },
  { _id: '5', title: 'Transformer Maintenance', clientName: 'EDF Energy', value: 95000, status: 'won', priority: 'low', deadline: '2026-05-30', bidNumber: 'BID-005' },
]
