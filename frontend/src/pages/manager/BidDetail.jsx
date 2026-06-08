import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, UserPlus, MessageSquare, Upload, Clock, CheckCircle, ShieldCheck, ShieldX, MapPin, Send, Video } from 'lucide-react'
import { bidsAPI } from '../../api/bids'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge'
import BidTimeline from '../../components/bids/BidTimeline'
import WinProbabilityCard from '../../components/ai/WinProbabilityCard'
import SentimentBadge from '../../components/ai/SentimentBadge'
import { DiscussionModal } from '../../components/bids/DiscussionModal'
import MeetingScheduleModal from '../../components/ui/MeetingScheduleModal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUSES = ['new', 'under_review', 'proposal_generated', 'awaiting_approval', 'negotiation', 'approved', 'won', 'lost']

export default function BidDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const role = user?.role
  const [bid, setBid] = useState(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [verifyNote, setVerifyNote] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showDiscussion, setShowDiscussion] = useState(false)
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    Promise.all([bidsAPI.getById(id), bidsAPI.getComments(id)])
      .then(([b, c]) => { setBid(b.data); setComments(c.data || []) })
      .catch(() => { setBid(MOCK_BID); setComments(MOCK_COMMENTS) })
      .finally(() => setLoading(false))
    if (['MANAGER', 'ADMIN'].includes(role)) {
      bidsAPI.getEmployees().then((r) => setEmployees(r.data || [])).catch(() => {})
    }
  }, [id])

  const updateStatus = async (status) => {
    try {
      await bidsAPI.updateStatus(id, status)
      setBid((prev) => ({ ...prev, status }))
      toast.success('Status updated')
    } catch { toast.error('Failed to update status') }
  }

  const addComment = async () => {
    if (!comment.trim()) return
    try {
      const res = await bidsAPI.addComment(id, comment)
      setComments((prev) => [...prev, res.data])
      setComment('')
    } catch {
      setComments((prev) => [...prev, { _id: Date.now(), text: comment, author: { name: 'You' }, createdAt: new Date().toISOString() }])
      setComment('')
    }
  }

  const handleVerify = async (approved) => {
    setVerifying(true)
    try {
      const res = await bidsAPI.verifyBid(id, { verificationStatus: approved ? 'verified' : 'rejected', verificationNote: verifyNote })
      setBid(res.data)
      toast.success(approved ? 'Bid verified!' : 'Bid rejected')
      setVerifyNote('')
    } catch { toast.error('Failed to verify bid') }
    finally { setVerifying(false) }
  }

  const handleAssign = async () => {
    if (!selectedEmployee) return toast.error('Select an employee')
    setAssigning(true)
    try {
      const res = await bidsAPI.assignEmployee(id, selectedEmployee)
      setBid(res.data)
      toast.success('Employee assigned!')
      setSelectedEmployee('')
    } catch { toast.error('Failed to assign employee') }
    finally { setAssigning(false) }
  }

  const handleFinalApproval = async (approved) => {
    setApproving(true)
    try {
      const res = await bidsAPI.finalApproval(id, { approved, managerApprovalNote: approvalNote })
      setBid(res.data)
      toast.success(approved ? 'Project marked as completed!' : 'Revision requested')
      setApprovalNote('')
    } catch { toast.error('Failed to process approval') }
    finally { setApproving(false) }
  }

  const uploadDocument = async (file) => {
    if (!file) return
    const doc = { name: file.name, url: '#', uploadedAt: new Date().toISOString() }
    try {
      const res = await bidsAPI.uploadDocument(id, doc)
      setBid((prev) => ({ ...prev, documents: [...(prev.documents || []), res.data] }))
      toast.success('Document added')
    } catch {
      setBid((prev) => ({ ...prev, documents: [...(prev.documents || []), doc] }))
      toast.success('Document added locally')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!bid) return <div style={{ color: 'var(--color-muted)', padding: 40, textAlign: 'center' }}>Bid not found</div>

  const isManager = ['MANAGER', 'ADMIN'].includes(role)
  const tabs = ['overview', 'workflow', 'tracking', 'timeline', 'documents', 'comments', 'ai insights']
  
  // Check if user can access discussion
  const canAccessDiscussion = (
    (role === 'CLIENT' && user?.id === bid?.clientId) ||
    (role === 'EMPLOYEE' && user?.id === bid?.assignedTo?.id) ||
    (isManager && bid?.assignedTo)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => uploadDocument(e.target.files?.[0])} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '6px 10px' }}><ArrowLeft size={14} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>{bid.title}</h1>
            <StatusBadge status={bid.status} />
            <PriorityBadge priority={bid.priority} />
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>#{bid.bidNumber} · {bid.clientName}</p>
        </div>
        {isManager && (
          <select className="input" value={bid.status} onChange={(e) => updateStatus(e.target.value)} style={{ height: 34, fontSize: 12, width: 160 }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
        )}
        {canAccessDiscussion && (
          <button 
            onClick={() => setShowDiscussion(true)}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: 12,
              padding: '8px 12px',
              height: 34
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <MessageSquare size={14} />
            Discuss
          </button>
        )}
        {(role === 'EMPLOYEE' || role === 'MANAGER' || role === 'ADMIN') && (
          <button 
            onClick={() => setShowMeetingScheduler(true)}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#a78bfa',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              fontSize: 12,
              padding: '8px 12px',
              height: 34
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
            }}
          >
            <Video size={14} />
            Schedule Meeting
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap',
            color: activeTab === t ? '#60a5fa' : 'var(--color-muted)',
            borderBottom: activeTab === t ? '2px solid #3b82f6' : '2px solid transparent',
            fontWeight: activeTab === t ? 600 : 400, textTransform: 'capitalize'
          }}>{t}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Bid Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Client', value: bid.clientName },
                  { label: 'Value / Budget', value: `$${(bid.value || bid.budget || 0).toLocaleString()}` },
                  { label: 'Deadline', value: bid.deadline ? new Date(bid.deadline).toLocaleDateString() : 'N/A' },
                  { label: 'Assigned To', value: bid.assignedTo?.name || 'Unassigned' },
                  { label: 'Created', value: new Date(bid.createdAt || Date.now()).toLocaleDateString() },
                  { label: 'Verification', value: bid.verificationStatus || 'pending' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 500, textTransform: label === 'Verification' ? 'capitalize' : 'none' }}>{value}</p>
                  </div>
                ))}
              </div>
              {bid.requirements && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Client Requirements</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text)', background: 'var(--color-surface2)', padding: '10px 12px', borderRadius: 8 }}>{bid.requirements}</p>
                </div>
              )}
              {bid.description && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Description</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>{bid.description}</p>
                </div>
              )}
            </div>
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Activity History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(bid.history || MOCK_HISTORY).map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={12} color="#60a5fa" />
                    </div>
                    <div>
                      <p style={{ fontSize: 13 }}>{h.action}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{h.userName || h.user} · {new Date(h.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <WinProbabilityCard bidId={id} initialProb={bid.aiWinProbability || 65} />
            {bid.clientSentiment && (
              <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Client Sentiment</h3>
                <SentimentBadge sentiment={bid.clientSentiment} />
              </div>
            )}
            {isManager && (
              <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('workflow')} style={{ justifyContent: 'flex-start', fontSize: 13 }}><ShieldCheck size={14} /> Verify / Assign</button>
                  <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ justifyContent: 'flex-start', fontSize: 13 }}><Upload size={14} /> Upload Document</button>
                  <button className="btn btn-success" onClick={() => updateStatus('approved')} style={{ justifyContent: 'flex-start', fontSize: 13 }}><CheckCircle size={14} /> Approve Bid</button>
                  <button className="btn btn-danger" onClick={() => updateStatus('lost')} style={{ justifyContent: 'flex-start', fontSize: 13 }}><Trash2 size={14} /> Mark as Lost</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WORKFLOW TAB (Manager only) ── */}
      {activeTab === 'workflow' && isManager && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Step 1: Verify Requirements */}
          <div className="card" style={{ borderColor: bid.verificationStatus === 'verified' ? 'rgba(16,185,129,0.3)' : bid.verificationStatus === 'rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: bid.verificationStatus === 'verified' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: bid.verificationStatus === 'verified' ? '#10b981' : '#f59e0b' }}>1</span>
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 14 }}>Verify Client Requirements & Budget</h3>
              {bid.verificationStatus === 'verified' && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: 999 }}>✓ Verified</span>}
              {bid.verificationStatus === 'rejected' && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 10px', borderRadius: 999 }}>✗ Rejected</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ padding: '10px 14px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Budget</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>${(bid.budget || bid.value || 0).toLocaleString()}</p>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Deadline</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{bid.deadline ? new Date(bid.deadline).toLocaleDateString() : 'Not set'}</p>
              </div>
            </div>
            {bid.requirements && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Client Requirements</p>
                <p style={{ fontSize: 13, lineHeight: 1.6 }}>{bid.requirements}</p>
              </div>
            )}
            {bid.verificationStatus === 'pending' && (
              <>
                <textarea className="input" rows={2} placeholder="Verification note (optional — e.g. requirements are clear, budget approved)" value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)} style={{ resize: 'vertical', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success" onClick={() => handleVerify(true)} disabled={verifying} style={{ flex: 1, justifyContent: 'center' }}>
                    <ShieldCheck size={14} /> {verifying ? 'Processing...' : 'Verify & Approve Requirements'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleVerify(false)} disabled={verifying} style={{ flex: 1, justifyContent: 'center' }}>
                    <ShieldX size={14} /> Reject Bid
                  </button>
                </div>
              </>
            )}
            {bid.verificationNote && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 10 }}>Note: {bid.verificationNote}</p>}
          </div>

          {/* Step 2: Assign Employee */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: bid.assignedTo ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: bid.assignedTo ? '#10b981' : '#3b82f6' }}>2</span>
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 14 }}>Assign Employee</h3>
              {bid.assignedTo && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: 999 }}>✓ Assigned to {bid.assignedTo?.name}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="input" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} style={{ flex: 1 }}>
                <option value="">Select employee...</option>
                {employees.map((emp) => <option key={emp._id || emp.id} value={emp._id || emp.id}>{emp.name} — {emp.company || emp.email}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleAssign} disabled={assigning || !selectedEmployee}>
                <UserPlus size={14} /> {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
            {employees.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 8 }}>No employees found. Make sure employees are registered with EMPLOYEE role.</p>
            )}
          </div>

          {/* Step 3: Final Approval */}
          {bid.status === 'awaiting_approval' && bid.completionNote !== undefined && (
            <div className="card" style={{ borderColor: 'rgba(139,92,246,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#8b5cf6' }}>3</span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 14 }}>Final Approval — Employee Submitted Work</h3>
              </div>
              {bid.completionNote && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(139,92,246,0.05)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.2)' }}>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Employee Completion Note</p>
                  <p style={{ fontSize: 13 }}>{bid.completionNote}</p>
                </div>
              )}
              <textarea className="input" rows={2} placeholder="Approval note (optional)" value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)} style={{ resize: 'vertical', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success" onClick={() => handleFinalApproval(true)} disabled={approving} style={{ flex: 1, justifyContent: 'center' }}>
                  <CheckCircle size={14} /> {approving ? 'Processing...' : 'Approve & Mark Complete'}
                </button>
                <button className="btn btn-danger" onClick={() => handleFinalApproval(false)} disabled={approving} style={{ flex: 1, justifyContent: 'center' }}>
                  Request Revision
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'workflow' && !isManager && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
          <ShieldCheck size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
          <p>Workflow management is only available to managers.</p>
        </div>
      )}

      {/* ── TRACKING TAB ── */}
      {activeTab === 'tracking' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <MapPin size={16} color="#60a5fa" />
            <h3 style={{ fontWeight: 600, fontSize: 14 }}>Project Tracking</h3>
          </div>
          <TrackingTimeline bid={bid} />
        </div>
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab === 'timeline' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Bid Journey</h3>
          <BidTimeline currentStatus={bid.status} />
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {activeTab === 'documents' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontWeight: 600, fontSize: 14 }}>Documents</h3>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ fontSize: 12 }}>
              <Upload size={14} /> Upload
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(bid.documents || []).map((doc, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: 'var(--color-surface2)', borderRadius: 8 }}>
                <span style={{ fontSize: 13 }}>{doc.name}</span>
                <span style={{ color: 'var(--color-muted)', fontSize: 11 }}>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'Just now'}</span>
              </div>
            ))}
            {(!bid.documents || bid.documents.length === 0) && <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No documents uploaded yet.</p>}
          </div>
        </div>
      )}

      {/* ── COMMENTS TAB ── */}
      {activeTab === 'comments' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Comments & Notes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {comments.map((c) => (
              <div key={c._id} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'white', flexShrink: 0 }}>
                  {c.author?.name?.[0] || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author?.name || 'User'}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 13, background: 'var(--color-surface2)', padding: '8px 12px', borderRadius: 8 }}>{c.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No comments yet.</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={addComment}><MessageSquare size={14} /> Post</button>
          </div>
        </div>
      )}

      {/* ── AI INSIGHTS TAB ── */}
      {activeTab === 'ai insights' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <WinProbabilityCard bidId={id} initialProb={bid.aiWinProbability || 65} />
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>AI Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Consider offering a 5% early payment discount', 'Similar bids won with technical support package', 'Client prefers detailed milestone breakdown', 'Competitor pricing is ~10% lower — adjust value proposition'].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'var(--color-surface2)', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: '#60a5fa', fontWeight: 700, flexShrink: 0 }}>→</span><span>{r}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Smart Priority Analysis</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              {[
                { label: 'Revenue Potential', score: 85, color: '#10b981' },
                { label: 'Deadline Urgency', score: 70, color: '#f59e0b' },
                { label: 'Client Importance', score: 90, color: '#3b82f6' },
                { label: 'Win Probability', score: bid.aiWinProbability || 65, color: '#8b5cf6' },
              ].map(({ label, score, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                    <span style={{ color, fontWeight: 600 }}>{score}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${score}%`, background: color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {showDiscussion && <DiscussionModal bidId={id} onClose={() => setShowDiscussion(false)} />}

      {/* Meeting Scheduler Modal */}
      {showMeetingScheduler && (
        <MeetingScheduleModal 
          bidId={id} 
          clientId={bid?.clientId} 
          clientName={bid?.clientName} 
          clientEmail={bid?.clientEmail}
          onClose={() => setShowMeetingScheduler(false)}
          onSuccess={() => toast.success('Meeting scheduled!')}
        />
      )}
    </div>
  )
}

// ── Tracking Timeline Component ──────────────────────────────────────────────
const STAGE_CONFIG = {
  submitted:          { label: 'Bid Submitted',          color: '#3b82f6', icon: '📋' },
  manager_review:     { label: 'Manager Review',         color: '#f59e0b', icon: '🔍' },
  verified:           { label: 'Requirements Verified',  color: '#10b981', icon: '✅' },
  assigned:           { label: 'Employee Assigned',      color: '#8b5cf6', icon: '👷' },
  in_progress:        { label: 'Work In Progress',       color: '#06b6d4', icon: '⚙️' },
  employee_submitted: { label: 'Work Submitted',         color: '#f59e0b', icon: '📤' },
  manager_approval:   { label: 'Manager Reviewing',      color: '#8b5cf6', icon: '🔎' },
  completed:          { label: 'Project Completed',      color: '#10b981', icon: '🎉' },
  rejected:           { label: 'Bid Rejected',           color: '#ef4444', icon: '❌' },
}

// Derive stages from bid status when trackingStages array is empty
function deriveStages(bid) {
  const stages = []
  const statusOrder = ['new', 'under_review', 'proposal_generated', 'awaiting_approval', 'negotiation', 'approved', 'won', 'lost']
  const currentIdx = statusOrder.indexOf(bid.status)

  if (currentIdx >= 0) stages.push({ stage: 'submitted', label: 'Bid Submitted', completedAt: bid.createdAt, completedByName: bid.clientName || 'Client' })
  if (bid.verificationStatus === 'verified') stages.push({ stage: 'verified', label: 'Requirements Verified', completedAt: bid.verifiedAt, completedByName: 'Manager', note: bid.verificationNote })
  if (bid.verificationStatus === 'rejected') stages.push({ stage: 'rejected', label: 'Bid Rejected', completedAt: bid.verifiedAt, completedByName: 'Manager', note: bid.verificationNote })
  if (bid.assignedTo) stages.push({ stage: 'assigned', label: `Assigned to ${bid.assignedTo?.name || 'Employee'}`, completedAt: bid.updatedAt, completedByName: 'Manager' })
  if (bid.completionSubmittedAt) stages.push({ stage: 'employee_submitted', label: 'Work Submitted by Employee', completedAt: bid.completionSubmittedAt, completedByName: bid.assignedTo?.name || 'Employee', note: bid.completionNote })
  if (bid.status === 'won') stages.push({ stage: 'completed', label: 'Project Completed', completedAt: bid.updatedAt, completedByName: 'Manager', note: bid.managerApprovalNote })
  return stages
}

function TrackingTimeline({ bid }) {
  const stages = (bid.trackingStages && bid.trackingStages.length > 0) ? bid.trackingStages : deriveStages(bid)

  if (stages.length === 0) {
    return <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No tracking data yet. Tracking updates as the bid progresses.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {stages.map((s, i) => {
        const cfg = STAGE_CONFIG[s.stage] || { label: s.label || s.stage, color: '#9ca3af', icon: '•' }
        const isLast = i === stages.length - 1
        return (
          <div key={i} style={{ display: 'flex', gap: 14 }}>
            {/* Left: icon + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${cfg.color}20`, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {cfg.icon}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, background: 'var(--color-border)', minHeight: 24, margin: '4px 0' }} />}
            </div>
            {/* Right: content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: cfg.color }}>{s.label || cfg.label}</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                {s.completedByName && `By ${s.completedByName}`}
                {s.completedAt && ` · ${new Date(s.completedAt).toLocaleString()}`}
              </p>
              {s.note && <p style={{ fontSize: 12, marginTop: 6, padding: '6px 10px', background: 'var(--color-surface2)', borderRadius: 6, color: 'var(--color-text)' }}>{s.note}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Mock data
const MOCK_BID = {
  _id: '1', title: 'Industrial Automation System', clientName: 'Siemens AG', value: 450000,
  status: 'negotiation', priority: 'high', deadline: '2026-06-15', bidNumber: 'BID-001',
  aiWinProbability: 78, clientSentiment: 'positive', department: 'Engineering',
  requirements: 'Complete industrial automation system including PLC programming, SCADA integration, and HMI development.',
  budget: 450000, verificationStatus: 'verified', verificationNote: 'Requirements are clear and budget is approved.',
  description: 'Full automation project for Siemens manufacturing facility.',
  assignedTo: { name: 'John Smith' }, createdAt: '2026-04-01', trackingStages: [],
}
const MOCK_HISTORY = [
  { action: 'Status changed to Negotiation', userName: 'Manager', timestamp: '2026-05-10T10:00:00Z' },
  { action: 'Bid assigned to John Smith', userName: 'Manager', timestamp: '2026-04-20T11:00:00Z' },
  { action: 'Bid created', userName: 'Manager', timestamp: '2026-04-01T08:00:00Z' },
]
const MOCK_COMMENTS = [
  { _id: '1', text: 'Client confirmed interest. Awaiting final budget approval.', author: { name: 'John Smith' }, createdAt: '2026-05-12T10:00:00Z' },
]
