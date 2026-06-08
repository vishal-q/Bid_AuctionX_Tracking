import { useEffect, useState } from 'react'
import { Plus, Download, RefreshCw, CheckSquare } from 'lucide-react'
import BidCard from '../../components/bids/BidCard'
import BidFilters from '../../components/bids/BidFilters'
import Modal from '../../components/ui/Modal'
import { useBidStore } from '../../store/bidStore'
import { bidsAPI } from '../../api/bids'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const EMPTY_BID = { title: '', clientName: '', value: '', deadline: '', description: '', priority: 'medium', status: 'new' }

export default function BidsManagement() {
  const { setBids, getFilteredBids, addBid, updateBid } = useBidStore()
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_BID)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState([])
  const [bulkStatus, setBulkStatus] = useState('under_review')

  const load = async () => {
    setLoading(true)
    try {
      const res = await bidsAPI.getAll()
      setBids(res.data.bids || res.data || [])
    } catch {
      setBids(MOCK_BIDS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await bidsAPI.create({ ...form, value: Number(form.value) })
      addBid(res.data)
      toast.success('Bid created!')
      setShowCreate(false)
      setForm(EMPTY_BID)
    } catch (err) {
      const msg = err?.response?.data?.message
      toast.error(msg || 'Failed to create bid')
    } finally {
      setSaving(false)
    }
  }

  const filtered = getFilteredBids()
  const allSelected = filtered.length > 0 && selected.length === filtered.length

  const toggleSelected = (id, checked) => {
    setSelected((prev) => checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id))
  }

  const toggleAll = () => {
    setSelected(allSelected ? [] : filtered.map((b) => b._id))
  }

  const exportCsv = () => {
    const rows = filtered.map((bid) => ({
      bidNumber: bid.bidNumber || bid._id,
      title: bid.title,
      clientName: bid.clientName,
      value: bid.value || 0,
      status: bid.status,
      priority: bid.priority,
      deadline: bid.deadline ? new Date(bid.deadline).toISOString().slice(0, 10) : '',
      winProbability: bid.aiWinProbability ?? '',
    }))
    const headers = Object.keys(rows[0] || { bidNumber: '', title: '', clientName: '', value: '', status: '', priority: '', deadline: '', winProbability: '' })
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bids-export-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const applyBulkStatus = async () => {
    if (selected.length === 0) return toast.error('Select bids first')
    try { await bidsAPI.bulkUpdateStatus(selected, bulkStatus) } catch {}
    selected.forEach((id) => updateBid(id, { status: bulkStatus }))
    toast.success(`Updated ${selected.length} bid(s)`)
    setSelected([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Bid Management</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{filtered.length} bids found</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={load} style={{ height: 36 }}><RefreshCw size={14} /></button>
          <button className="btn btn-secondary" onClick={exportCsv} style={{ height: 36 }}><Download size={14} /> Export</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ height: 36 }}><Plus size={14} /> New Bid</button>
        </div>
      </div>

      <BidFilters />

      <div className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={toggleAll} style={{ height: 32, fontSize: 12 }}>
          <CheckSquare size={14} /> {allSelected ? 'Clear selection' : 'Select visible'}
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{selected.length} selected</span>
          <select className="input" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ height: 32, width: 160, fontSize: 12 }}>
            {['new', 'under_review', 'proposal_generated', 'awaiting_approval', 'negotiation', 'approved', 'won', 'lost'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={applyBulkStatus} style={{ height: 32, fontSize: 12 }}>Apply Status</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((bid) => <BidCard key={bid._id} bid={bid} selectable selected={selected.includes(bid._id)} onSelect={toggleSelected} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
              No bids found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Create Bid Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Bid" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'title', label: 'Bid Title', type: 'text', placeholder: 'e.g. Industrial Automation System' },
            { key: 'clientName', label: 'Client Name', type: 'text', placeholder: 'e.g. Siemens AG' },
            { key: 'value', label: 'Bid Value ($)', type: 'number', placeholder: '500000' },
            { key: 'deadline', label: 'Deadline', type: 'date' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>{label}</label>
              <input className="input" type={type} placeholder={placeholder} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Description</label>
            <textarea className="input" rows={3} placeholder="Bid description..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Bid'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const MOCK_BIDS = [
  { _id: '1', title: 'Industrial Automation System', clientName: 'Siemens AG', value: 450000, status: 'negotiation', priority: 'high', deadline: '2026-06-15', bidNumber: 'BID-001', aiWinProbability: 78, progress: 75 },
  { _id: '2', title: 'Power Grid Upgrade', clientName: 'National Grid', value: 1200000, status: 'awaiting_approval', priority: 'high', deadline: '2026-06-20', bidNumber: 'BID-002', aiWinProbability: 62, progress: 60 },
  { _id: '3', title: 'SCADA System Integration', clientName: 'Shell Corp', value: 320000, status: 'proposal_generated', priority: 'medium', deadline: '2026-07-01', bidNumber: 'BID-003', aiWinProbability: 55, progress: 45 },
  { _id: '4', title: 'Motor Control Center', clientName: 'BASF SE', value: 180000, status: 'under_review', priority: 'medium', deadline: '2026-07-10', bidNumber: 'BID-004', aiWinProbability: 40, progress: 25 },
  { _id: '5', title: 'Transformer Maintenance', clientName: 'EDF Energy', value: 95000, status: 'won', priority: 'low', deadline: '2026-05-30', bidNumber: 'BID-005', aiWinProbability: 92, progress: 100 },
  { _id: '6', title: 'HV Switchgear Supply', clientName: 'BP Global', value: 670000, status: 'new', priority: 'high', deadline: '2026-08-01', bidNumber: 'BID-006', aiWinProbability: 35, progress: 10 },
]
