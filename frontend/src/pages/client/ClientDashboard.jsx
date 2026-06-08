import { useEffect, useState } from 'react'
import { FileText, Clock, CheckCircle, TrendingUp, Plus, Send, MapPin, AlertCircle } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import BidCard from '../../components/bids/BidCard'
import Modal from '../../components/ui/Modal'
import { bidsAPI } from '../../api/bids'
import { locationAPI } from '../../api/location'
import { useBidStore } from '../../store/bidStore'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const EMPTY_FORM = { title: '', requirements: '', budget: '', deadline: '', priority: 'medium', description: '' }

export default function ClientDashboard() {
  const { user } = useAuthStore()
  const { bids, setBids, addBid } = useBidStore()
  const [loading, setLoading] = useState(true)
  const [showSubmit, setShowSubmit] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [locationSharing, setLocationSharing] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const navigate = useNavigate()

  const load = () => {
    bidsAPI.getMyBids()
      .then((res) => setBids(res.data || []))
      .catch(() => setBids([]))
      .finally(() => setLoading(false))
  }

  // Check if location sharing is already on
  useEffect(() => {
    load()
    locationAPI.getMyLocation()
      .then(res => setLocationSharing(res.data?.locationSharing || false))
      .catch(() => {})
  }, [])

  // Enable location sharing — get GPS + save to backend
  const enableLocation = async () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported by your browser')
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          // Reverse geocode
          let locationName = 'Unknown'
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            const data = await res.json()
            locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown'
          } catch {}
          await locationAPI.updateLocation({ latitude, longitude, locationName, locationSharing: true })
          setLocationSharing(true)
          toast.success(`Location enabled: ${locationName}`)
        } catch {
          toast.error('Failed to save location')
        } finally {
          setLocationLoading(false)
        }
      },
      () => {
        setLocationLoading(false)
        toast.error('Could not get your location. Please allow location access.')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Bid title is required')
    if (!form.requirements.trim()) return toast.error('Requirements are required')
    if (!form.budget || Number(form.budget) <= 0) return toast.error('Please enter a valid budget')

    // ── Compulsory location check ──────────────────────────────────────────
    if (!locationSharing) {
      toast.error('Location sharing is required to submit a bid. Please enable it below.')
      return
    }

    setSaving(true)
    try {
      const res = await bidsAPI.create({
        title: form.title.trim(),
        requirements: form.requirements.trim(),
        budget: Number(form.budget),
        value: Number(form.budget),
        deadline: form.deadline || undefined,
        priority: form.priority,
        description: form.description.trim(),
        clientName: user?.company || user?.name,
        status: 'new',
      })
      addBid(res.data)
      toast.success('Bid submitted! Manager will review your requirements.')
      setShowSubmit(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit bid')
    } finally {
      setSaving(false)
    }
  }

  const activeBids = bids.filter((b) => !['won', 'lost'].includes(b.status))
  const wonBids = bids.filter((b) => b.status === 'won')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Track your bid status and proposals in real-time</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSubmit(true)} style={{ height: 38 }}>
          <Plus size={14} /> Submit New Bid
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard title="Total Bids" value={bids.length} icon={FileText} color="blue" />
        <StatCard title="In Progress" value={activeBids.length} icon={Clock} color="yellow" />
        <StatCard title="Completed" value={wonBids.length} icon={CheckCircle} color="green" />
        <StatCard title="Avg Win Prob" value={bids.length ? `${Math.round(bids.reduce((a, b) => a + (b.aiWinProbability || 0), 0) / bids.length)}%` : '0%'} icon={TrendingUp} color="purple" />
      </div>

      {/* Bid Tracking Overview */}
      {activeBids.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <MapPin size={16} color="#60a5fa" />
            <h3 style={{ fontWeight: 600, fontSize: 14 }}>Active Bid Tracking</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeBids.slice(0, 5).map((bid) => (
              <div key={bid._id}
                onClick={() => navigate(`/client/bids/${bid._id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-surface2)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--color-border)', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{bid.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>#{bid.bidNumber}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrackingPill status={bid.status} verificationStatus={bid.verificationStatus} />
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Bids */}
      <div>
        <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>My Bids</h2>
        {loading ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Loading...</p>
        ) : bids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
            <FileText size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No bids yet. Submit your first bid!</p>
            <button className="btn btn-primary" onClick={() => setShowSubmit(true)} style={{ marginTop: 14 }}>
              <Plus size={14} /> Submit New Bid
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {bids.map((bid) => <BidCard key={bid._id} bid={bid} />)}
          </div>
        )}
      </div>

      {/* Submit Bid Modal */}
      <Modal isOpen={showSubmit} onClose={() => { setShowSubmit(false); setForm(EMPTY_FORM) }} title="Submit New Bid" size="md">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Bid Title *</label>
            <input className="input" type="text" placeholder="e.g. Website Redesign Project" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Requirements *</label>
            <textarea className="input" rows={4} placeholder="Describe your requirements in detail — what do you need, scope of work, deliverables, etc."
              value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              style={{ resize: 'vertical' }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Budget ($) *</label>
              <input className="input" type="number" placeholder="50000" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} required min="1" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Deadline</label>
              <input className="input" type="date" value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Additional Notes</label>
            <textarea className="input" rows={2} placeholder="Any additional information..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)', fontSize: 12, color: 'var(--color-muted)' }}>
            📋 After submission, the manager will review your requirements and budget, then assign an employee to work on your project.
          </div>

          {/* Compulsory location section */}
          <div style={{
            padding: '12px 14px', borderRadius: 8, fontSize: 12,
            background: locationSharing ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
            border: `1px solid ${locationSharing ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.3)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: locationSharing ? '#10b981' : '#f59e0b',
                  boxShadow: locationSharing ? '0 0 6px #10b981' : 'none',
                }} />
                <div>
                  <p style={{ fontWeight: 600, color: locationSharing ? '#34d399' : '#fbbf24', marginBottom: 2 }}>
                    {locationSharing ? '✅ Location Enabled' : '⚠️ Location Required'}
                  </p>
                  <p style={{ color: 'var(--color-muted)', fontSize: 11 }}>
                    {locationSharing
                      ? 'Your location will be shared with the manager when you submit.'
                      : 'You must enable location sharing to submit a bid.'}
                  </p>
                </div>
              </div>
              {!locationSharing && (
                <button
                  type="button"
                  onClick={enableLocation}
                  disabled={locationLoading}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: '#f59e0b', color: 'white', fontSize: 12, fontWeight: 600,
                    flexShrink: 0, opacity: locationLoading ? 0.7 : 1,
                  }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {locationLoading ? 'Getting...' : 'Enable'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowSubmit(false); setForm(EMPTY_FORM) }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !locationSharing}>
              <Send size={13} /> {saving ? 'Submitting...' : 'Submit Bid'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// Small pill showing current tracking status
function TrackingPill({ status, verificationStatus }) {
  const map = {
    new: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    under_review: { label: 'Under Review', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    proposal_generated: { label: 'Employee Assigned', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    awaiting_approval: { label: 'Awaiting Approval', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    negotiation: { label: 'In Progress', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    won: { label: 'Completed ✓', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    lost: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  }
  const info = map[status] || { label: status, color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' }
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: info.bg, color: info.color, fontWeight: 600, border: `1px solid ${info.color}30` }}>
      {info.label}
    </span>
  )
}
