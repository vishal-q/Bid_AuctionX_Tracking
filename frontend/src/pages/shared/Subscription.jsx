import { useEffect, useState } from 'react'
import { CreditCard, Check, X, Zap, Shield, BarChart2, Map, Star, AlertCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { paymentAPI } from '../../api/payment'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const PLAN_ICONS = { FREE: '🆓', BASIC: '⚡', PRO: '🚀', ENTERPRISE: '🏢' }
const PLAN_COLORS = {
  FREE:       { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', color: '#9ca3af', btn: '#6b7280' },
  BASIC:      { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  color: '#60a5fa', btn: '#3b82f6' },
  PRO:        { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.3)',  color: '#a78bfa', btn: '#8b5cf6' },
  ENTERPRISE: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24', btn: '#f59e0b' },
}

function PlanFeature({ enabled, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      {enabled
        ? <Check size={14} color="#10b981" style={{ flexShrink: 0 }} />
        : <X size={14} color="#6b7280" style={{ flexShrink: 0 }} />}
      <span style={{ fontSize: 13, color: enabled ? 'var(--color-text)' : 'var(--color-muted)' }}>{label}</span>
    </div>
  )
}

function PaymentModal({ plan, billingCycle, onClose, onSuccess }) {
  const [method, setMethod] = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [processing, setProcessing] = useState(false)

  const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price
  const saving = billingCycle === 'yearly' ? Math.round(((plan.price * 12) - plan.yearlyPrice) / (plan.price * 12) * 100) : 0

  const formatCard = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 4)
    return v.length >= 2 ? v.slice(0, 2) + '/' + v.slice(2) : v
  }

  const handlePay = async () => {
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) return toast.error('Enter valid card number')
      if (expiry.length < 5) return toast.error('Enter valid expiry date')
      if (cvv.length < 3) return toast.error('Enter valid CVV')
      if (!cardName.trim()) return toast.error('Enter cardholder name')
    }
    if (method === 'upi' && !upiId.includes('@')) return toast.error('Enter valid UPI ID (e.g. name@upi)')

    setProcessing(true)
    try {
      const payload = {
        plan: plan.name,
        billingCycle,
        paymentMethod: method,
        cardLast4: method === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : '',
        cardBrand: method === 'card' ? detectCardBrand(cardNumber) : '',
        upiId: method === 'upi' ? upiId : '',
      }
      const res = await paymentAPI.subscribe(payload)
      if (res.data.status === 'success') {
        toast.success(res.data.message)
        onSuccess(res.data)
      } else {
        toast.error(res.data.message || 'Payment failed')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const detectCardBrand = (num) => {
    const n = num.replace(/\s/g, '')
    if (n.startsWith('4')) return 'Visa'
    if (n.startsWith('5')) return 'Mastercard'
    if (n.startsWith('3')) return 'Amex'
    return 'Card'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 16, width: '100%', maxWidth: 480, padding: 28,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Complete Payment</h2>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>
              {plan.displayName} Plan · {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Amount */}
        <div style={{
          padding: '14px 16px', borderRadius: 10, marginBottom: 20,
          background: PLAN_COLORS[plan.name]?.bg || 'rgba(59,130,246,0.1)',
          border: `1px solid ${PLAN_COLORS[plan.name]?.border || 'rgba(59,130,246,0.3)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Total Amount</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: PLAN_COLORS[plan.name]?.color }}>
              ${amount.toFixed(2)}
            </p>
            {saving > 0 && <p style={{ fontSize: 11, color: '#10b981' }}>You save {saving}% with yearly billing</p>}
          </div>
          <div style={{ fontSize: 32 }}>{PLAN_ICONS[plan.name]}</div>
        </div>

        {/* Payment method tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'card', label: '💳 Card' },
            { id: 'upi', label: '📱 UPI' },
            { id: 'netbanking', label: '🏦 Net Banking' },
          ].map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: method === m.id ? '#3b82f6' : 'var(--color-surface2)',
              color: method === m.id ? 'white' : 'var(--color-muted)',
              transition: 'all 0.2s',
            }}>{m.label}</button>
          ))}
        </div>

        {/* Card form */}
        {method === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Card Number</label>
              <input className="input" placeholder="1234 5678 9012 3456"
                value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Expiry</label>
                <input className="input" placeholder="MM/YY"
                  value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>CVV</label>
                <input className="input" placeholder="123" type="password" maxLength={4}
                  value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Cardholder Name</label>
              <input className="input" placeholder="Name on card"
                value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>
          </div>
        )}

        {/* UPI form */}
        {method === 'upi' && (
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>UPI ID</label>
            <input className="input" placeholder="yourname@upi"
              value={upiId} onChange={(e) => setUpiId(e.target.value)} />
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
              Supported: GPay, PhonePe, Paytm, BHIM
            </p>
          </div>
        )}

        {/* Net Banking */}
        {method === 'netbanking' && (
          <div style={{ padding: '16px', background: 'var(--color-surface2)', borderRadius: 8, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              You will be redirected to your bank's secure payment page.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
              {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'].map((bank) => (
                <div key={bank} style={{
                  padding: '8px', borderRadius: 6, background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)', fontSize: 12, textAlign: 'center',
                  cursor: 'pointer', color: 'var(--color-text)',
                }}>{bank}</div>
              ))}
            </div>
          </div>
        )}

        {/* Security note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 16 }}>
          <Shield size={12} color="#10b981" />
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>256-bit SSL encrypted · Secure payment</span>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={processing}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: processing ? '#374151' : (PLAN_COLORS[plan.name]?.btn || '#3b82f6'),
            color: 'white', fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}>
          {processing ? (
            <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
          ) : (
            <><CreditCard size={16} /> Pay ${amount.toFixed(2)}</>
          )}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function Subscription() {
  const { user, updateUser } = useAuthStore()
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')

  useEffect(() => {
    Promise.all([
      paymentAPI.getPlans(),
      paymentAPI.getMySubscription(),
      paymentAPI.getPaymentHistory(),
    ]).then(([p, s, h]) => {
      setPlans(p.data || [])
      setSubscription(s.data)
      setHistory(h.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSelectPlan = (plan) => {
    if (plan.name === subscription?.plan) return
    if (plan.name === 'FREE') {
      setShowCancelConfirm(true)
      return
    }
    setSelectedPlan(plan)
    setShowPayModal(true)
  }

  const handlePaymentSuccess = (data) => {
    setShowPayModal(false)
    setSubscription(data.subscription)
    updateUser({ subscriptionPlan: data.subscription?.plan })
    paymentAPI.getPaymentHistory().then(r => setHistory(r.data || [])).catch(() => {})
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await paymentAPI.cancelSubscription({ reason: cancelReason || 'User requested' })
      toast.success(res.data.message)
      setSubscription(prev => ({ ...prev, status: 'cancelled' }))
      setShowCancelConfirm(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel')
    } finally {
      setCancelling(false) }
  }

  const currentPlan = subscription?.plan || 'FREE'
  const planOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']
  const currentPlanIdx = planOrder.indexOf(currentPlan)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--color-muted)' }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={22} color="#3b82f6" /> Subscription & Billing
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 2 }}>
            Manage your plan, payments, and billing history
          </p>
        </div>
      </div>

      {/* Current plan banner */}
      {subscription && (
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: PLAN_COLORS[currentPlan]?.bg || 'rgba(59,130,246,0.1)',
          border: `1px solid ${PLAN_COLORS[currentPlan]?.border || 'rgba(59,130,246,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{PLAN_ICONS[currentPlan]}</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: PLAN_COLORS[currentPlan]?.color }}>
                {currentPlan} Plan
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                Status: <span style={{ color: subscription.status === 'active' ? '#10b981' : '#f87171', fontWeight: 600 }}>
                  {subscription.status?.toUpperCase()}
                </span>
                {subscription.subscriptionEnd && (
                  <> · Renews {new Date(subscription.subscriptionEnd).toLocaleDateString()}</>
                )}
              </p>
            </div>
          </div>
          {currentPlan !== 'FREE' && subscription.status === 'active' && (
            <button onClick={() => setShowCancelConfirm(true)} className="btn btn-danger" style={{ fontSize: 12, height: 34 }}>
              Cancel Subscription
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)' }}>
        {['plans', 'history'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 20px', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
            color: activeTab === tab ? '#60a5fa' : 'var(--color-muted)',
            borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
          }}>{tab === 'plans' ? '📋 Plans' : '🧾 Payment History'}</button>
        ))}
      </div>

      {/* Plans tab */}
      {activeTab === 'plans' && (
        <>
          {/* Billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: billingCycle === 'monthly' ? 'var(--color-text)' : 'var(--color-muted)' }}>Monthly</span>
            <div
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              style={{
                width: 48, height: 26, borderRadius: 999, cursor: 'pointer', position: 'relative',
                background: billingCycle === 'yearly' ? '#3b82f6' : 'var(--color-surface2)',
                border: '1px solid var(--color-border)', transition: 'background 0.2s',
              }}>
              <div style={{
                position: 'absolute', top: 3, left: billingCycle === 'yearly' ? 24 : 3,
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
            <span style={{ fontSize: 13, color: billingCycle === 'yearly' ? 'var(--color-text)' : 'var(--color-muted)' }}>
              Yearly <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Save up to 17%</span>
            </span>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {plans.map((plan) => {
              const isCurrent = plan.name === currentPlan
              const isUpgrade = planOrder.indexOf(plan.name) > currentPlanIdx
              const isDowngrade = planOrder.indexOf(plan.name) < currentPlanIdx && plan.name !== 'FREE'
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price
              const colors = PLAN_COLORS[plan.name] || PLAN_COLORS.BASIC

              return (
                <div key={plan.id || plan.name} style={{
                  background: 'var(--color-surface)', borderRadius: 14, padding: 20,
                  border: isCurrent ? `2px solid ${colors.color}` : '1px solid var(--color-border)',
                  position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: isCurrent ? `0 0 20px ${colors.bg}` : 'none',
                }}
                  onMouseEnter={(e) => { if (!isCurrent) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = isCurrent ? `0 0 20px ${colors.bg}` : 'none' }}
                >
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      background: colors.btn, color: 'white', fontSize: 10, fontWeight: 700,
                      padding: '2px 10px', borderRadius: 999,
                    }}>CURRENT PLAN</div>
                  )}
                  {plan.name === 'PRO' && !isCurrent && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      background: '#8b5cf6', color: 'white', fontSize: 10, fontWeight: 700,
                      padding: '2px 10px', borderRadius: 999,
                    }}>MOST POPULAR</div>
                  )}

                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{PLAN_ICONS[plan.name]}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.color }}>{plan.displayName}</h3>
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>{plan.description}</p>
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)' }}>
                        ${price === 0 ? '0' : price.toFixed(0)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <PlanFeature enabled label={`${plan.maxBids === -1 ? 'Unlimited' : plan.maxBids} Active Bids`} />
                    <PlanFeature enabled label={`${plan.maxEmployees === -1 ? 'Unlimited' : plan.maxEmployees} Employees`} />
                    <PlanFeature enabled={plan.aiFeatures} label="AI Features" />
                    <PlanFeature enabled={plan.mapTracking} label="Live Map Tracking" />
                    <PlanFeature enabled={plan.advancedAnalytics} label="Advanced Analytics" />
                    <PlanFeature enabled={plan.customReports} label="Custom Reports" />
                    <PlanFeature enabled={plan.prioritySupport} label="Priority Support" />
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                      cursor: isCurrent ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
                      background: isCurrent ? 'var(--color-surface2)' : colors.btn,
                      color: isCurrent ? 'var(--color-muted)' : 'white',
                      transition: 'all 0.2s',
                    }}>
                    {isCurrent ? 'Current Plan' : isUpgrade ? '⬆ Upgrade' : isDowngrade ? '⬇ Downgrade' : plan.name === 'FREE' ? 'Downgrade to Free' : 'Select Plan'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {history.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)' }}>
              <CreditCard size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No payment history yet</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Invoice', 'Plan', 'Amount', 'Method', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.invoiceNumber || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.planName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>${(p.amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, textTransform: 'capitalize' }}>{p.paymentMethod || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                        background: p.status === 'success' ? 'rgba(16,185,129,0.15)' : p.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: p.status === 'success' ? '#10b981' : p.status === 'failed' ? '#ef4444' : '#f59e0b',
                      }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-muted)' }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          billingCycle={billingCycle}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Cancel Confirm Modal */}
      {showCancelConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 14, width: '100%', maxWidth: 420, padding: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <AlertCircle size={22} color="#ef4444" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cancel Subscription?</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              You will retain access to your current plan until the end of the billing period.
              After that, your account will be downgraded to the Free plan.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Reason (optional)</label>
              <textarea className="input" rows={3} placeholder="Tell us why you're cancelling..."
                value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCancelConfirm(false)}>Keep Plan</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
