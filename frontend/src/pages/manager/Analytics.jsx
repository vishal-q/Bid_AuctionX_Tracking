import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, FunnelChart, Funnel, LabelList, ComposedChart, Legend } from 'recharts'
import { TrendingUp, Award, DollarSign, Users, Target, Zap, ArrowUpRight } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const MONTHLY = [
  { month: 'Jan', revenue: 320, bids: 18, won: 8, lost: 4, conversion: 44 },
  { month: 'Feb', revenue: 280, bids: 14, won: 6, lost: 3, conversion: 43 },
  { month: 'Mar', revenue: 450, bids: 22, won: 11, lost: 5, conversion: 50 },
  { month: 'Apr', revenue: 390, bids: 19, won: 9, lost: 4, conversion: 47 },
  { month: 'May', revenue: 520, bids: 26, won: 13, lost: 6, conversion: 50 },
  { month: 'Jun', revenue: 480, bids: 23, won: 12, lost: 5, conversion: 52 },
]

const EMPLOYEES = [
  { name: 'John Smith', won: 14, total: 22, revenue: 680 },
  { name: 'Sarah Lee', won: 11, total: 18, revenue: 520 },
  { name: 'Mike Chen', won: 9, total: 16, revenue: 410 },
  { name: 'Emma Davis', won: 8, total: 15, revenue: 380 },
  { name: 'Tom Wilson', won: 6, total: 12, revenue: 290 },
]

const CLIENTS = [
  { name: 'Siemens AG', value: 45 }, { name: 'National Grid', value: 30 },
  { name: 'Shell Corp', value: 25 }, { name: 'BASF SE', value: 20 }, { name: 'EDF Energy', value: 15 },
]

const RADAR_DATA = [
  { subject: 'Revenue', A: 85 }, { subject: 'Win Rate', A: 72 }, { subject: 'Speed', A: 68 },
  { subject: 'Client Sat', A: 90 }, { subject: 'Team Perf', A: 78 }, { subject: 'AI Score', A: 82 },
]

// New data for additional analytics
const FORECAST = [
  { month: 'Jan', actual: 320, forecast: null },
  { month: 'Feb', actual: 280, forecast: null },
  { month: 'Mar', actual: 450, forecast: null },
  { month: 'Apr', actual: 390, forecast: null },
  { month: 'May', actual: 520, forecast: null },
  { month: 'Jun', actual: 480, forecast: null },
  { month: 'Jul', actual: null, forecast: 530 },
  { month: 'Aug', actual: null, forecast: 580 },
  { month: 'Sep', actual: null, forecast: 620 },
]

const PIPELINE = [
  { name: 'New Bids', value: 26, fill: '#3b82f6' },
  { name: 'Under Review', value: 20, fill: '#8b5cf6' },
  { name: 'Proposal Sent', value: 15, fill: '#f59e0b' },
  { name: 'Negotiation', value: 10, fill: '#06b6d4' },
  { name: 'Won', value: 7, fill: '#10b981' },
]

const CONVERSION = [
  { month: 'Jan', rate: 44, target: 50 },
  { month: 'Feb', rate: 43, target: 50 },
  { month: 'Mar', rate: 50, target: 50 },
  { month: 'Apr', rate: 47, target: 50 },
  { month: 'May', rate: 50, target: 50 },
  { month: 'Jun', rate: 52, target: 50 },
]

const PRIORITY_DATA = [
  { name: 'High', value: 8, color: '#ef4444' },
  { name: 'Medium', value: 14, color: '#f59e0b' },
  { name: 'Low', value: 6, color: '#10b981' },
]

export default function Analytics() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Analytics & Insights</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Performance metrics and business intelligence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard title="Total Revenue" value="$2.84M" icon={DollarSign} color="green" change={15} />
        <StatCard title="Win Rate" value="47%" icon={Award} color="blue" change={3} />
        <StatCard title="Avg Deal Size" value="$42K" icon={TrendingUp} color="purple" change={8} />
        <StatCard title="Active Employees" value="12" icon={Users} color="yellow" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Revenue Trend (Monthly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Performance Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Radar dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Win/Loss by Month</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="won" fill="#10b981" radius={[3, 3, 0, 0]} name="Won" />
              <Bar dataKey="lost" fill="#ef4444" radius={[3, 3, 0, 0]} name="Lost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Top Clients by Bids</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CLIENTS} layout="vertical">
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee performance */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Top Performing Employees</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Employee', 'Bids Won', 'Total Bids', 'Win Rate', 'Revenue ($K)', 'Performance'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--color-muted)', fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((e, i) => {
                const rate = Math.round((e.won / e.total) * 100)
                return (
                  <tr key={e.name} style={{ borderBottom: '1px solid rgba(55,65,81,0.3)' }}>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[i]}, ${COLORS[(i + 1) % COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'white' }}>
                          {e.name[0]}
                        </div>
                        {e.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', color: '#34d399', fontWeight: 600 }}>{e.won}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--color-muted)' }}>{e.total}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ color: rate >= 50 ? '#34d399' : '#fbbf24', fontWeight: 600 }}>{rate}%</span>
                    </td>
                    <td style={{ padding: '10px 10px' }}>${e.revenue}K</td>
                    <td style={{ padding: '10px 10px', width: 120 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${rate}%`, background: COLORS[i] }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── NEW: Revenue Forecast ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color="#f59e0b" /> Revenue Forecast (Next 3 Months)
          </h3>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
            AI Projected
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={FORECAST}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="url(#actualGrad)" strokeWidth={2} name="Actual Revenue ($K)" connectNulls={false} />
            <Area type="monotone" dataKey="forecast" stroke="#f59e0b" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 5" name="Forecast ($K)" connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
          {[{ label: 'Jul Forecast', val: '$530K', color: '#f59e0b' }, { label: 'Aug Forecast', val: '$580K', color: '#f59e0b' }, { label: 'Sep Forecast', val: '$620K', color: '#10b981' }].map(f => (
            <div key={f.label} style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--color-surface2)', borderRadius: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: f.color }}>{f.val}</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── NEW: Bid Pipeline Funnel + Conversion Rate ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pipeline Funnel */}
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} color="#8b5cf6" /> Bid Pipeline Funnel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PIPELINE.map((stage, i) => {
              const pct = Math.round((stage.value / PIPELINE[0].value) * 100)
              return (
                <div key={stage.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{stage.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: stage.fill }}>{stage.value} bids ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--color-surface2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: stage.fill, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
            <p style={{ fontSize: 12, color: '#34d399' }}>
              🏆 Overall conversion: <strong>{Math.round((PIPELINE[4].value / PIPELINE[0].value) * 100)}%</strong> — {PIPELINE[4].value} won out of {PIPELINE[0].value} new bids
            </p>
          </div>
        </div>

        {/* Conversion Rate vs Target */}
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpRight size={14} color="#10b981" /> Conversion Rate vs Target
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={CONVERSION}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="rate" fill="#10b981" radius={[3, 3, 0, 0]} name="Actual %" opacity={0.8} />
              <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Target %" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.08)', borderRadius: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>52%</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Best Month (Jun)</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(59,130,246,0.08)', borderRadius: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#60a5fa' }}>48%</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Avg Rate</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(245,158,11,0.08)', borderRadius: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>+2%</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>vs Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── NEW: Priority Distribution ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Bid Priority Split</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PRIORITY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {PRIORITY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {PRIORITY_DATA.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--color-muted)' }}>{p.name} Priority</span>
                <span style={{ fontWeight: 600, color: p.color }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Monthly Bids vs Won Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={MONTHLY}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="bids" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Total Bids" opacity={0.6} />
              <Bar dataKey="won" fill="#10b981" radius={[3, 3, 0, 0]} name="Won" />
              <Line type="monotone" dataKey="conversion" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Conv %" yAxisId={0} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
