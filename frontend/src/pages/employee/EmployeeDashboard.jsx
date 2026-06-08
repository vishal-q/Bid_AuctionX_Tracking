import { useEffect, useState } from 'react'
import { Briefcase, Clock, CheckCircle, AlertTriangle, Send, TrendingUp, FileText, Plus, Star, Target } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import BidCard from '../../components/bids/BidCard'
import Modal from '../../components/ui/Modal'
import { bidsAPI } from '../../api/bids'
import { useBidStore } from '../../store/bidStore'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

// ── Work Log helpers (localStorage) ──────────────────────────────────────────
const getWorkLogs = () => { try { return JSON.parse(localStorage.getItem('employee-worklogs') || '[]') } catch { return [] } }
const saveWorkLogs = (logs) => localStorage.setItem('employee-worklogs', JSON.stringify(logs))
const getBidNotes = () => { try { return JSON.parse(localStorage.getItem('employee-bidnotes') || '{}') } catch { return {} } }
const saveBidNotes = (notes) => localStorage.setItem('employee-bidnotes', JSON.stringify(notes))

export default function EmployeeDashboard() {
  const { user } = useAuthStore()
  const { bids, setBids, updateBid } = useBidStore()
  const [loading, setLoading] = useState(true)
  const [showComplete, setShowComplete] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)
  const [completionNote, setCompletionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Work Log state
  const [workLogs, setWorkLogs] = useState(getWorkLogs)
  const [logHours, setLogHours] = useState('')
  const [logBid, setLogBid] = useState('')
  const [logDesc, setLogDesc] = useState('')
  // Bid Notes state
  const [bidNotes, setBidNotes] = useState(getBidNotes)
  const [showNotes, setShowNotes] = useState(false)
  const [notesBid, setNotesBid] = useState(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    bidsAPI.getMyBids()
      .then((res) => setBids(res.data || []))
      .catch(() => setBids([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmitCompletion = async (e) => {
    e.preventDefault()
    if (!selectedBid) return
    setSubmitting(true)
    try {
      const res = await bidsAPI.submitCompletion(selectedBid._id, { completionNote })
      updateBid(selectedBid._id, res.data)
      toast.success('Work submitted for manager approval!')
      setShowComplete(false)
      setCompletionNote('')
      setSelectedBid(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const activeBids = bids.filter((b) => !['won', 'lost', 'awaiting_approval'].includes(b.status))
  const pendingApproval = bids.filter((b) => b.status === 'awaiting_approval')
  const completed = bids.filter((b) => b.status === 'won')
  const urgent = bids.filter((b) => b.priority === 'high' && !['won', 'lost'].includes(b.status))

  const addWorkLog = () => {
    if (!logHours || !logBid) return toast.error('Select bid and enter hours')
    const log = { id: Date.now(), bidId: logBid, bidTitle: bids.find(b => b._id === logBid)?.title || logBid, hours: Number(logHours), desc: logDesc, date: new Date().toLocaleDateString() }
    const updated = [log, ...workLogs].slice(0, 20)
    setWorkLogs(updated); saveWorkLogs(updated)
    setLogHours(''); setLogDesc(''); toast.success('Work logged!')
  }

  const totalHoursToday = workLogs.filter(l => l.date === new Date().toLocaleDateString()).reduce((s, l) => s + l.hours, 0)
  const totalHoursAll = workLogs.reduce((s, l) => s + l.hours, 0)

  const openNotes = (bid) => { setNotesBid(bid); setNoteText(bidNotes[bid._id] || ''); setShowNotes(true) }
  const saveNote = () => { const updated = { ...bidNotes, [notesBid._id]: noteText }; setBidNotes(updated); saveBidNotes(updated); setShowNotes(false); toast.success('Note saved!') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Hello, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Your assigned bids and tasks</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard title="Assigned Bids" value={bids.length} icon={Briefcase} color="blue" />
        <StatCard title="In Progress" value={activeBids.length} icon={Clock} color="yellow" />
        <StatCard title="Awaiting Approval" value={pendingApproval.length} icon={Send} color="purple" />
        <StatCard title="Completed" value={completed.length} icon={CheckCircle} color="green" />
      </div>

      {/* Urgent */}
      {urgent.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="#f87171" />
            <h3 style={{ fontWeight: 600, fontSize: 14, color: '#f87171' }}>Urgent Bids — Action Required</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {urgent.map((b) => (
              <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(239,68,68,0.05)', borderRadius: 6, fontSize: 13 }}>
                <span>{b.title}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#f87171', fontSize: 12 }}>Due: {b.deadline ? new Date(b.deadline).toLocaleDateString() : 'N/A'}</span>
                  {!['won', 'lost', 'awaiting_approval'].includes(b.status) && (
                    <button className="btn btn-primary" style={{ fontSize: 11, height: 26, padding: '0 10px' }}
                      onClick={() => { setSelectedBid(b); setShowComplete(true) }}>
                      <Send size={11} /> Submit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Bids */}
      <div>
        <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Assigned Bids</h2>
        {loading ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Loading...</p>
        ) : bids.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>No bids assigned yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {bids.map((bid) => (
              <div key={bid._id} style={{ position: 'relative' }}>
                <BidCard bid={bid} />
                {!['won', 'lost', 'awaiting_approval'].includes(bid.status) && bid.assignedTo && (
                  <button
                    className="btn btn-primary"
                    style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 11, height: 28, padding: '0 10px' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedBid(bid); setShowComplete(true) }}>
                    <Send size={11} /> Submit Work
                  </button>
                )}
                {bid.status === 'awaiting_approval' && (
                  <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 11, padding: '3px 10px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', borderRadius: 999, border: '1px solid rgba(139,92,246,0.3)' }}>
                    ⏳ Awaiting Approval
                  </div>
                )}
                {/* Notes button */}
                <button onClick={(e) => { e.stopPropagation(); openNotes(bid) }}
                  style={{ position: 'absolute', top: 12, right: 12, background: bidNotes[bid._id] ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${bidNotes[bid._id] ? 'rgba(245,158,11,0.3)' : 'var(--color-border)'}`, borderRadius: 6, cursor: 'pointer', color: bidNotes[bid._id] ? '#fbbf24' : 'var(--color-muted)', padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={11} /> {bidNotes[bid._id] ? 'Notes ✓' : 'Notes'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Work Log Section ── */}
      <div className="card">
        <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={15} color="#f59e0b" /> Work Log
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-muted)' }}>
            Today: <strong style={{ color: '#f59e0b' }}>{totalHoursToday}h</strong> · Total: <strong style={{ color: '#60a5fa' }}>{totalHoursAll}h</strong>
          </span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr auto', gap: 8, marginBottom: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Bid</label>
            <select className="input" value={logBid} onChange={e => setLogBid(e.target.value)} style={{ fontSize: 13 }}>
              <option value="">Select bid...</option>
              {bids.map(b => <option key={b._id} value={b._id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Hours</label>
            <input className="input" type="number" min="0.5" max="24" step="0.5" placeholder="2.5" value={logHours} onChange={e => setLogHours(e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Description</label>
            <input className="input" placeholder="What did you work on?" value={logDesc} onChange={e => setLogDesc(e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <button onClick={addWorkLog} className="btn btn-primary" style={{ height: 38, padding: '0 14px' }}>
            <Plus size={14} /> Log
          </button>
        </div>
        {workLogs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
            {workLogs.slice(0, 8).map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'var(--color-surface2)', borderRadius: 7, fontSize: 12 }}>
                <span style={{ color: '#f59e0b', fontWeight: 700, minWidth: 36 }}>{log.hours}h</span>
                <span style={{ flex: 1, color: 'var(--color-text)' }}>{log.bidTitle}</span>
                <span style={{ color: 'var(--color-muted)', fontSize: 11 }}>{log.desc}</span>
                <span style={{ color: 'var(--color-muted)', fontSize: 11 }}>{log.date}</span>
              </div>
            ))}
          </div>
        )}
        {workLogs.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: 10 }}>No work logged yet. Start tracking your time!</p>}
      </div>

      {/* ── Performance Stats ── */}
      <div className="card">
        <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={15} color="#10b981" /> My Performance
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Win Rate', value: bids.length ? `${Math.round((completed.length / bids.length) * 100)}%` : '0%', color: '#10b981', icon: '🏆' },
            { label: 'Active Bids', value: activeBids.length, color: '#f59e0b', icon: '⚡' },
            { label: 'Hours Logged', value: `${totalHoursAll}h`, color: '#60a5fa', icon: '⏱️' },
            { label: 'Completed', value: completed.length, color: '#a78bfa', icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--color-surface2)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Completion Modal */}
      <Modal isOpen={showComplete} onClose={() => { setShowComplete(false); setCompletionNote(''); setSelectedBid(null) }} title="Submit Work Completion" size="sm">
        <form onSubmit={handleSubmitCompletion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedBid && (
            <div style={{ padding: '10px 14px', background: 'var(--color-surface2)', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>Bid</p>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{selectedBid.title}</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>#{selectedBid.bidNumber}</p>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Completion Note</label>
            <textarea className="input" rows={4} placeholder="Describe what was completed, deliverables, any notes for the manager..."
              value={completionNote} onChange={(e) => setCompletionNote(e.target.value)}
              style={{ resize: 'vertical' }} required />
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(139,92,246,0.05)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)', fontSize: 12, color: 'var(--color-muted)' }}>
            📤 After submission, the manager will review your work and either approve or request revision.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowComplete(false); setCompletionNote(''); setSelectedBid(null) }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={13} /> {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Bid Notes Modal */}
      <Modal isOpen={showNotes} onClose={() => setShowNotes(false)} title={`Notes — ${notesBid?.title || ''}`} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea className="input" rows={6} placeholder="Write your private notes for this bid — ideas, blockers, progress details..."
            value={noteText} onChange={e => setNoteText(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowNotes(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveNote}><FileText size={13} /> Save Note</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
