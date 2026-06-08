import { useEffect, useState } from 'react'
import { Download, FileText, TrendingUp, DollarSign, Award, BarChart2, RefreshCw } from 'lucide-react'
import { bidsAPI } from '../../api/bids'
import { authAPI } from '../../api/auth'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Reports() {
  const [bids, setBids] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [bRes, aRes] = await Promise.all([bidsAPI.getAll({ limit: 500 }), bidsAPI.getAnalytics()])
      setBids(bRes.data?.bids || bRes.data || [])
      setAnalytics(aRes.data)
    } catch { setBids([]); setAnalytics(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const exportCSV = (data, filename) => {
    if (!data.length) return toast.error('No data to export')
    const headers = Object.keys(data[0])
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers.join(','), ...data.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filename} downloaded!`)
  }

  const exportBidsReport = () => {
    const rows = bids.map((b) => ({
      'Bid Number': b.bidNumber || '',
      'Title': b.title || '',
      'Client': b.clientName || '',
      'Value ($)': b.value || 0,
      'Budget ($)': b.budget || b.value || 0,
      'Status': b.status?.replace(/_/g, ' ') || '',
      'Priority': b.priority || '',
      'Assigned To': b.assignedTo?.name || 'Unassigned',
      'Verification': b.verificationStatus || 'pending',
      'Progress (%)': b.progress || 0,
      'Win Probability (%)': b.aiWinProbability || '',
      'Deadline': b.deadline ? new Date(b.deadline).toLocaleDateString() : '',
      'Created': b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '',
    }))
    exportCSV(rows, `bids-report-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const exportWonBids = () => {
    const won = bids.filter((b) => b.status === 'won').map((b) => ({
      'Bid Number': b.bidNumber || '',
      'Title': b.title || '',
      'Client': b.clientName || '',
      'Value ($)': b.value || 0,
      'Assigned To': b.assignedTo?.name || '',
      'Completed': b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : '',
    }))
    exportCSV(won, `won-bids-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const exportPendingBids = () => {
    const pending = bids.filter((b) => !['won', 'lost'].includes(b.status)).map((b) => ({
      'Bid Number': b.bidNumber || '',
      'Title': b.title || '',
      'Client': b.clientName || '',
      'Value ($)': b.value || 0,
      'Status': b.status?.replace(/_/g, ' ') || '',
      'Priority': b.priority || '',
      'Assigned To': b.assignedTo?.name || 'Unassigned',
      'Deadline': b.deadline ? new Date(b.deadline).toLocaleDateString() : '',
    }))
    exportCSV(pending, `active-bids-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // ── Computed stats ──────────────────────────────────────────────────────────
  const stats = analytics?.stats || {}
  const totalRevenue = bids.filter((b) => b.status === 'won').reduce((s, b) => s + (b.value || 0), 0)
  const avgDealSize = bids.length ? Math.round(bids.reduce((s, b) => s + (b.value || 0), 0) / bids.length) : 0
  const winRate = bids.length ? Math.round((bids.filter((b) => b.status === 'won').length / bids.length) * 100) : 0
  const pendingVerification = bids.filter((b) => b.verificationStatus === 'pending' && b.status === 'new').length

  // Status distribution for chart
  const statusDist = Object.entries(
    bids.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))

  // Priority distribution
  const priorityDist = [
    { name: 'High', value: bids.filter((b) => b.priority === 'high').length },
    { name: 'Medium', value: bids.filter((b) => b.priority === 'medium').length },
    { name: 'Low', value: bids.filter((b) => b.priority === 'low').length },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Reports & Export</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Generate and download reports from live data</p>
        </div>
        <button className="btn btn-secondary" onClick={load} style={{ height: 36 }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Bids', value: bids.length, icon: FileText, color: '#60a5fa' },
          { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: '#34d399' },
          { label: 'Win Rate', value: `${winRate}%`, icon: Award, color: '#a78bfa' },
          { label: 'Avg Deal Size', value: `$${(avgDealSize / 1000).toFixed(0)}K`, icon: TrendingUp, color: '#fbbf24' },
          { label: 'Pending Verify', value: pendingVerification, icon: BarChart2, color: '#f87171' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Bid Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusDist}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={priorityDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                {priorityDist.map((_, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#10b981'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
            {priorityDist.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#ef4444', '#f59e0b', '#10b981'][i] }} />
                <span style={{ color: 'var(--color-muted)' }}>{p.name} ({p.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {[
          {
            title: 'Full Bids Report',
            desc: `All ${bids.length} bids with complete details — status, value, assignment, verification, win probability`,
            color: '#3b82f6',
            action: exportBidsReport,
            count: bids.length,
            label: 'Total Bids',
          },
          {
            title: 'Won Bids Report',
            desc: 'All successfully completed bids with client and revenue details',
            color: '#10b981',
            action: exportWonBids,
            count: bids.filter((b) => b.status === 'won').length,
            label: 'Won Bids',
          },
          {
            title: 'Active Bids Report',
            desc: 'All currently active bids with deadlines and assignment status',
            color: '#f59e0b',
            action: exportPendingBids,
            count: bids.filter((b) => !['won', 'lost'].includes(b.status)).length,
            label: 'Active Bids',
          },
        ].map(({ title, desc, color, action, count, label }) => (
          <div key={title} className="card" style={{ borderColor: `${color}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} color={color} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color }}>{count}</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)' }}>{label}</p>
              </div>
            </div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.5 }}>{desc}</p>
            <button className="btn btn-secondary" onClick={action} style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
              <Download size={13} /> Download CSV
            </button>
          </div>
        ))}
      </div>

      {/* Recent bids table */}
      <div className="card">
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Bid Summary Table</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Bid #', 'Title', 'Client', 'Value', 'Status', 'Priority', 'Assigned To', 'Deadline'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--color-muted)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bids.slice(0, 20).map((bid) => (
                <tr key={bid._id} style={{ borderBottom: '1px solid rgba(55,65,81,0.3)' }}>
                  <td style={{ padding: '9px 10px', color: 'var(--color-muted)', fontSize: 11 }}>{bid.bidNumber}</td>
                  <td style={{ padding: '9px 10px', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bid.title}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--color-muted)' }}>{bid.clientName}</td>
                  <td style={{ padding: '9px 10px', color: '#34d399', fontWeight: 600 }}>${(bid.value || 0).toLocaleString()}</td>
                  <td style={{ padding: '9px 10px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: bid.status === 'won' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: bid.status === 'won' ? '#34d399' : '#60a5fa' }}>
                      {bid.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <span style={{ fontSize: 11, color: bid.priority === 'high' ? '#f87171' : bid.priority === 'medium' ? '#fbbf24' : '#34d399' }}>
                      {bid.priority}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px', color: 'var(--color-muted)' }}>{bid.assignedTo?.name || '—'}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--color-muted)', fontSize: 12 }}>{bid.deadline ? new Date(bid.deadline).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bids.length > 20 && <p style={{ fontSize: 12, color: 'var(--color-muted)', padding: '10px 10px 0', textAlign: 'center' }}>Showing 20 of {bids.length} bids. Download CSV for full report.</p>}
        </div>
      </div>
    </div>
  )
}
