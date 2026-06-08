import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp, Lock, Mail } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../api/auth'
import toast from 'react-hot-toast'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.fromRegister) {
      logout()
    }
    const email = location.state?.email
    if (email) setForm((prev) => ({ ...prev, email }))
  }, [location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()
    const password = form.password
    if (!EMAIL_REGEX.test(email)) return toast.error('Enter a valid email address')
    if (!password) return toast.error('Password is required')

    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      // If OTP required — redirect to OTP verification page
      if (res.data.otpRequired) {
        toast.success('OTP sent to your email!')
        navigate('/verify-otp', { state: { email, userName: res.data.name || '' } })
        return
      }
      // Direct login (fallback when email not configured)
      const { token, user } = res.data
      login(user, token)
      toast.success(`Welcome back, ${user.name}!`)
      const role = user.role?.toLowerCase()
      if (role === 'client') navigate('/client', { replace: true })
      else if (role === 'employee') navigate('/employee', { replace: true })
      else navigate('/manager', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        toast.error('Backend not running. Please start the backend server.')
      } else if (err.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.')
      } else {
        toast.error(msg || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 16 }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: 400, height: 400, background: 'rgba(59,130,246,0.05)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '30%', width: 300, height: 300, background: 'rgba(139,92,246,0.05)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <TrendingUp size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 6px rgba(139,92,246,0.6))', letterSpacing: '0.5px' }}>BidNova AuctionX</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 2, letterSpacing: '1px', textTransform: 'uppercase' }}>Tracking</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>Intelligent Bid Lifecycle Management</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6, display: 'block' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input className="input" type="email" placeholder="you@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.trimStart().toLowerCase() })}
                style={{ paddingLeft: 32 }} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6, display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input className="input" type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 32, paddingRight: 36 }} required />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none' }}>Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', height: 40 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Google Sign In */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>
          <a
            href={`${import.meta.env.VITE_API_URL}/auth/google`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </a>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}
