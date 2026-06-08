export default function StatCard({ title, value, icon: Icon, color = 'blue', change, subtitle }) {
  const colors = {
    blue: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', icon: '#60a5fa', glow: 'glow-blue' },
    purple: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', icon: '#a78bfa', glow: 'glow-purple' },
    green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: '#34d399', glow: 'glow-green' },
    red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: '#f87171', glow: '' },
    yellow: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: '#fbbf24', glow: '' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`card animate-fade-in ${c.glow}`} style={{ borderColor: c.border }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)' }}>{value}</p>
          {subtitle && <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>{subtitle}</p>}
          {change !== undefined && (
            <p style={{ fontSize: 12, marginTop: 4, color: change >= 0 ? '#34d399' : '#f87171' }}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: 10 }}>
            <Icon size={20} color={c.icon} />
          </div>
        )}
      </div>
    </div>
  )
}
