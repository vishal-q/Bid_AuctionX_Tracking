import { Search, RotateCcw } from 'lucide-react'
import { useBidStore } from '../../store/bidStore'

const STATUSES = ['all', 'new', 'under_review', 'proposal_generated', 'awaiting_approval', 'negotiation', 'approved', 'won', 'lost']
const PRIORITIES = ['all', 'high', 'medium', 'low']
const DUE_WINDOWS = [
  { value: 'all', label: 'Any Deadline' },
  { value: 'overdue', label: 'Overdue' },
  { value: '7', label: 'Due 7 Days' },
  { value: '30', label: 'Due 30 Days' },
]

export default function BidFilters() {
  const { filters, setFilters } = useBidStore()

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input className="input" placeholder="Search bids..." value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          style={{ paddingLeft: 30, width: 200, height: 34, fontSize: 13 }} />
      </div>

      <select className="input" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}
        style={{ width: 160, height: 34, fontSize: 13 }}>
        {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
      </select>

      <select className="input" value={filters.priority} onChange={(e) => setFilters({ priority: e.target.value })}
        style={{ width: 140, height: 34, fontSize: 13 }}>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p === 'all' ? 'All Priority' : p.toUpperCase()}</option>)}
      </select>

      <select className="input" value={filters.due} onChange={(e) => setFilters({ due: e.target.value })}
        style={{ width: 145, height: 34, fontSize: 13 }}>
        {DUE_WINDOWS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>

      <input className="input" type="number" placeholder="Min value" value={filters.minValue}
        onChange={(e) => setFilters({ minValue: e.target.value })}
        style={{ width: 110, height: 34, fontSize: 13 }} />
      <input className="input" type="number" placeholder="Max value" value={filters.maxValue}
        onChange={(e) => setFilters({ maxValue: e.target.value })}
        style={{ width: 110, height: 34, fontSize: 13 }} />

      <button className="btn btn-secondary" onClick={() => setFilters({ status: 'all', priority: 'all', search: '', minValue: '', maxValue: '', due: 'all' })} style={{ height: 34, padding: '0 10px' }} title="Reset filters">
        <RotateCcw size={13} />
      </button>
    </div>
  )
}
