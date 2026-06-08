import { Users, Briefcase, Award, TrendingUp } from 'lucide-react'

const TEAM = [
  { id: 1, name: 'John Smith', role: 'Senior Engineer', email: 'john@bidflow.com', activeBids: 5, wonBids: 14, winRate: 64, status: 'active' },
  { id: 2, name: 'Sarah Lee', role: 'Bid Manager', email: 'sarah@bidflow.com', activeBids: 4, wonBids: 11, winRate: 61, status: 'active' },
  { id: 3, name: 'Mike Chen', role: 'Technical Lead', email: 'mike@bidflow.com', activeBids: 3, wonBids: 9, winRate: 56, status: 'active' },
  { id: 4, name: 'Emma Davis', role: 'Sales Engineer', email: 'emma@bidflow.com', activeBids: 4, wonBids: 8, winRate: 53, status: 'active' },
  { id: 5, name: 'Tom Wilson', role: 'Project Manager', email: 'tom@bidflow.com', activeBids: 2, wonBids: 6, winRate: 50, status: 'busy' },
]

export default function Team() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Team Management</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{TEAM.length} team members</p>
        </div>
        <button className="btn btn-primary"><Users size={14} /> Add Member</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {TEAM.map((member, i) => (
          <div key={member.id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {member.name[0]}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{member.name}</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{member.role}</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: member.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: member.status === 'active' ? '#34d399' : '#fbbf24', border: `1px solid ${member.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                  {member.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { icon: Briefcase, label: 'Active', value: member.activeBids, color: '#60a5fa' },
                { icon: Award, label: 'Won', value: member.wonBids, color: '#34d399' },
                { icon: TrendingUp, label: 'Win Rate', value: `${member.winRate}%`, color: '#a78bfa' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                  <Icon size={12} color={color} style={{ marginBottom: 3 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color }}>{value}</p>
                  <p style={{ fontSize: 10, color: 'var(--color-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Performance</span>
                <span style={{ fontSize: 11, color: '#60a5fa' }}>{member.winRate}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${member.winRate}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
              </div>
            </div>

            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 10 }}>{member.email}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
