export default function LoadingSpinner({ size = 24, color = '#3b82f6' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <div style={{
        width: size, height: size, border: `2px solid rgba(59,130,246,0.2)`,
        borderTop: `2px solid ${color}`, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 6px rgba(139,92,246,0.6))' }}>
        BidNova AuctionX Tracking
      </div>
      <LoadingSpinner size={32} />
    </div>
  )
}
