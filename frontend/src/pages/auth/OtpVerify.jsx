import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TrendingUp, Shield, RefreshCw } from 'lucide-react'
import { authAPI } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function OtpVerify() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()

  const email = location.state?.email
  const userName = location.state?.userName || 'User'

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return // only digits
    const newOtp = [...otp]
    newOtp[idx] = val.slice(-1) // only last digit
    setOtp(newOtp)
    // Auto-focus next
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((d, i) => { if (i < 6) newOtp[i] = d })
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) return toast.error('Enter the complete 6-digit OTP')
    setLoading(true)
    try {
      const res = await authAPI.verifyOtp({ email, otp: code })
      const { token, user } = res.data
      login(user, token)
      toast.success(`Welcome back, ${user.name}! ✅`)
      const role = user.role?.toLowerCase()
      if (role === 'client') navigate('/client', { replace: true })
      else if (role === 'employee') navigate('/employee', { replace: true })
      else navigate('/manager', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setResending(true)
    try {
      await authAPI.resendOtp(email)
      toast.success('New OTP sent to your email!')
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 16 }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: 400, height: 400, background: 'rgba(59,130,246,0.05)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Shield size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.5))' }}>BidNova AuctionX</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 6 }}>
            We sent a 6-digit OTP to
          </p>
          <p style={{ color: '#60a5fa', fontSize: 14, fontWeight: 600, marginTop: 2 }}>{email}</p>
        </div>

        {/* OTP Input boxes */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputRefs.current[idx] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              style={{
                width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                borderRadius: 10, border: `2px solid ${digit ? '#3b82f6' : 'var(--color-border)'}`,
                background: 'var(--color-surface2)', color: 'var(--color-text)',
                outline: 'none', transition: 'border-color 0.2s',
                caretColor: '#3b82f6',
              }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = digit ? '#3b82f6' : 'var(--color-border)'}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length < 6}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 15, marginBottom: 16 }}>
          {loading
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
            : '✅ Verify OTP'}
        </button>

        {/* Resend */}
        <div style={{ textAlign: 'center' }}>
          {countdown > 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Resend OTP in <span style={{ color: '#60a5fa', fontWeight: 600 }}>{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 13, fontWeight: 600 }}>
              {resending ? 'Sending...' : '🔄 Resend OTP'}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-muted)' }}>
          Wrong account?{' '}
          <button onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 12 }}>
            Back to Login
          </button>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
