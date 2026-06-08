const STATUS_MAP = {
  new: 'New',
  under_review: 'Under Review',
  proposal_generated: 'Proposal',
  awaiting_approval: 'Awaiting Approval',
  negotiation: 'Negotiation',
  approved: 'Approved',
  won: 'Won',
  lost: 'Lost',
}

const PRIORITY_MAP = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW' }

export function StatusBadge({ status }) {
  const key = status?.toLowerCase().replace(/ /g, '_')
  const label = STATUS_MAP[key] || status
  const cls = {
    new: 'badge-new', under_review: 'badge-review', proposal_generated: 'badge-proposal',
    awaiting_approval: 'badge-review', negotiation: 'badge-negotiation',
    approved: 'badge-approved', won: 'badge-won', lost: 'badge-lost',
  }[key] || 'badge-new'
  return <span className={`badge ${cls}`}>{label}</span>
}

export function PriorityBadge({ priority }) {
  const key = priority?.toLowerCase()
  const cls = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[key] || 'badge-low'
  return <span className={`badge ${cls}`}>{PRIORITY_MAP[key] || priority}</span>
}
