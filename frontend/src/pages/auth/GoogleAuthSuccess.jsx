import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { TrendingUp } from 'lucide-react'

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams()
  const { login } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')

    if (!token || !userStr) {
      toast.error('Google login failed. Please try again.')
      navigate('/login', { replace: true })
      return
    }

    try {
      // searchParams.get() already decodes URL encoding — same as Node.js URLSearchParams behavior
      const user = JSON.parse(userStr)
      login(user, token)
      toast.success(`Welcome, ${user.name}!`)
      const role = user.role?.toLowerCase()
      if (role === 'client') navigate('/client', { replace: true })
      else if (role === 'employee') navigate('/employee', { replace: true })
      else navigate('/manager', { replace: true })
    } catch {
      toast.error('Google login failed. Please try again.')
      navigate('/login', { replace: true })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TrendingUp size={24} color="white" />
      </div>
      <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Signing you in with Google...</p>
      <div style={{
        width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)',
        borderTop: '3px solid #6366f1', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
