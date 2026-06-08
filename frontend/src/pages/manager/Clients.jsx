import { useEffect, useState } from 'react'
import { User, Mail, Building2, Phone, Calendar, Search, FileText } from 'lucide-react'
import { authAPI } from '../../api/auth'
import { bidsAPI } from '../../api/bids'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [selectedBids, setSelectedBids] = useState([])
  const [bidsLoading, setBidsLoading] = useState(false)

  useEffect(() => {
    authAPI.getUsers('CLIENT')
      .then((res) => setClients(res.data || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  const openProfile = async (client) => {
    setSelected(client)
    setBidsLoading(true)
    try {
      const res = await bidsAPI.getAll({ limit: 100 })
      const all = res.data?.bids || res.data || []
      setSelectedBids(all.filter((b) => b.clientId === client._id || b.clientId?._id === client._id || b.clientName === client.company || b.clientName === client.name))
    } catch { setSelectedBids([]) }
    finally { setBidsLoading(false) }
  }

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Clients</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{filtered.length} registered clients</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          <input className="input" placeholder="Search clients..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 30, width: 220, height: 36, fontSize: 13 }} />
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>
          <User size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>{search ? 'No clients match your search.' : 'No clients registered yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((client, i) => (
            <div key={client._id} className="card animate-fade-in"
              style={{ cursor: 'pointer', transition: 'all 0.2s', animationDelay: `${i * 0.04}s` }}
              onClick={() => openProfile(client)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}>

              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 3) % COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {client.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{client.company || 'Client'}</p>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: client.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)', color: client.isActive ? '#34d399' : '#9ca3af', border: `1px solid ${client.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)'}`, flexShrink: 0 }}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                  <Mail size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                </div>
                {client.company && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                    <Building2 size={12} /><span>{client.company}</span>
                  </div>
                )}
                {client.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                    <Phone size={12} /><span>{client.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                  <Calendar size={12} /><span>Joined {new Date(client.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {client.lastLogin ? `Last login: ${new Date(client.lastLogin).toLocaleDateString()}` : 'Never logged in'}
                </span>
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>View Profile →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setSelectedBids([]) }} title="Client Profile" size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {selected.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Client · {selected.company || 'No company'}</p>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: selected.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)', color: selected.isActive ? '#34d399' : '#9ca3af' }}>
                  {selected.isActive ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Email', value: selected.email, icon: Mail },
                { label: 'Company', value: selected.company || '—', icon: Building2 },
                { label: 'Phone', value: selected.phone || '—', icon: Phone },
                { label: 'Joined', value: new Date(selected.createdAt).toLocaleDateString(), icon: Calendar },
                { label: 'Last Login', value: selected.lastLogin ? new Date(selected.lastLogin).toLocaleString() : 'Never', icon: Calendar },
                { label: 'Auth', value: selected.authProvider || 'local', icon: User },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon size={11} color="var(--color-muted)" />
                    <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{label}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Bid Stats */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Bid History</p>
              {bidsLoading ? (
                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Loading bids...</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Total Bids', value: selectedBids.length, color: '#60a5fa' },
                      { label: 'Active', value: selectedBids.filter((b) => !['won', 'lost'].includes(b.status)).length, color: '#fbbf24' },
                      { label: 'Completed', value: selectedBids.filter((b) => b.status === 'won').length, color: '#34d399' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}</p>
                        <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  {selectedBids.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                      {selectedBids.map((b) => (
                        <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--color-surface2)', borderRadius: 7, fontSize: 12 }}>
                          <div>
                            <p style={{ fontWeight: 500 }}>{b.title}</p>
                            <p style={{ color: 'var(--color-muted)', fontSize: 11 }}>#{b.bidNumber} · ${(b.value || 0).toLocaleString()}</p>
                          </div>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: b.status === 'won' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: b.status === 'won' ? '#34d399' : '#60a5fa' }}>
                            {b.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedBids.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>No bids submitted yet.</p>}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
