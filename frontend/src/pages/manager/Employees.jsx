import { useEffect, useState } from 'react'
import { Users, Mail, Building2, Phone, Calendar, Search, Briefcase, Link as LinkIcon, GitBranch, Award, ExternalLink, BookOpen, Star } from 'lucide-react'
import { authAPI } from '../../api/auth'
import { bidsAPI } from '../../api/bids'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [selectedBids, setSelectedBids] = useState([])
  const [bidsLoading, setBidsLoading] = useState(false)

  useEffect(() => {
    authAPI.getUsers('EMPLOYEE')
      .then((res) => setEmployees(res.data || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  const openProfile = async (emp) => {
    setSelected(emp)
    setBidsLoading(true)
    try {
      const res = await bidsAPI.getAll({ limit: 50 })
      const all = res.data?.bids || res.data || []
      setSelectedBids(all.filter((b) => b.assignedTo?._id === emp._id || b.assignedTo === emp._id))
    } catch { setSelectedBids([]) }
    finally { setBidsLoading(false) }
  }

  const filtered = employees.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.company?.toLowerCase().includes(search.toLowerCase())
  )

  const wonBids = (bids) => bids.filter((b) => b.status === 'won').length
  const activeBids = (bids) => bids.filter((b) => !['won', 'lost'].includes(b.status)).length

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Employees</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{filtered.length} registered employees</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          <input className="input" placeholder="Search employees..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 30, width: 220, height: 36, fontSize: 13 }} />
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>
          <Users size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>{search ? 'No employees match your search.' : 'No employees registered yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((emp, i) => (
            <div key={emp._id} className="card animate-fade-in"
              style={{ cursor: 'pointer', transition: 'all 0.2s', animationDelay: `${i * 0.04}s` }}
              onClick={() => openProfile(emp)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}>

              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {emp.name?.[0]?.toUpperCase() || 'E'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Employee</p>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: emp.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)', color: emp.isActive ? '#34d399' : '#9ca3af', border: `1px solid ${emp.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)'}`, flexShrink: 0 }}>
                  {emp.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                  <Mail size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                </div>
                {emp.company && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                    <Building2 size={12} /><span>{emp.company}</span>
                  </div>
                )}
                {emp.specialization && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#a78bfa' }}>
                    <Award size={12} /><span>{emp.specialization}{emp.yearsOfExperience ? ` · ${emp.yearsOfExperience} yrs` : ''}</span>
                  </div>
                )}
                {emp.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                    <Phone size={12} /><span>{emp.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                  <Calendar size={12} /><span>Joined {new Date(emp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {emp.linkedinUrl && (
                    <a href={emp.linkedinUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      style={{ color: '#0077b5', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                      <LinkIcon size={12} /> LinkedIn
                    </a>
                  )}
                  {emp.githubUrl && (
                    <a href={emp.githubUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                      <GitBranch size={12} /> GitHub
                    </a>
                  )}
                  {!emp.linkedinUrl && !emp.githubUrl && (
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                      {emp.lastLogin ? `Last login: ${new Date(emp.lastLogin).toLocaleDateString()}` : 'Never logged in'}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>View Profile →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setSelectedBids([]) }} title="Employee Profile" size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {selected.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Employee · {selected.company || 'No company'}</p>
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
                { label: 'Auth', value: selected.authProvider || 'local', icon: Users },
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

            {/* Professional Bio */}
            {(selected.specialization || selected.linkedinUrl || selected.githubUrl || selected.projects?.length > 0) && (
              <div style={{ background: 'var(--color-surface2)', borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={14} color="#a78bfa" /> Professional Profile
                </p>

                {/* Specialization + Experience */}
                {selected.specialization && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Specialization</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{selected.specialization}</p>
                    </div>
                    {selected.yearsOfExperience != null && (
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Experience</p>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{selected.yearsOfExperience} years</p>
                      </div>
                    )}
                  </div>
                )}

                {/* LinkedIn + GitHub */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  {selected.linkedinUrl && (
                    <a href={selected.linkedinUrl} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, background: 'rgba(0,119,181,0.1)', color: '#0077b5', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(0,119,181,0.2)' }}>
                      <LinkIcon size={13} /> LinkedIn <ExternalLink size={10} />
                    </a>
                  )}
                  {selected.githubUrl && (
                    <a href={selected.githubUrl} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, background: 'rgba(156,163,175,0.1)', color: 'var(--color-text)', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid var(--color-border)' }}>
                      <GitBranch size={13} /> GitHub <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                {/* Experience Proof */}
                {selected.experienceProof && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Experience Proof</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{selected.experienceProof}</p>
                  </div>
                )}

                {/* Projects */}
                {selected.projects?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <BookOpen size={12} color="#60a5fa" /> Projects ({selected.projects.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                      {selected.projects.map((proj, idx) => (
                        <div key={idx} style={{ padding: '10px 12px', background: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>{proj.title}</p>
                            {proj.projectUrl && (
                              <a href={proj.projectUrl} target="_blank" rel="noreferrer"
                                style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                          {proj.description && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.4 }}>{proj.description}</p>}
                          {proj.techStack && (
                            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {proj.techStack.split(',').map((t, i) => (
                                <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                                  {t.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bid Stats */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Bid Activity</p>
              {bidsLoading ? (
                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Loading bids...</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Total Assigned', value: selectedBids.length, color: '#60a5fa' },
                      { label: 'Active', value: activeBids(selectedBids), color: '#fbbf24' },
                      { label: 'Completed', value: wonBids(selectedBids), color: '#34d399' },
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
                            <p style={{ color: 'var(--color-muted)', fontSize: 11 }}>#{b.bidNumber}</p>
                          </div>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: b.status === 'won' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: b.status === 'won' ? '#34d399' : '#60a5fa' }}>
                            {b.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedBids.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>No bids assigned yet.</p>}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
