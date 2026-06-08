import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { TrendingUp, User, Mail, Lock, Briefcase, Link as LinkIcon, GitBranch, Plus, Trash2, Award, BookOpen } from 'lucide-react'
import { authAPI } from '../../api/auth'
import toast from 'react-hot-toast'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY_PROJECT = { title: '', description: '', techStack: '', projectUrl: '' }

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'CLIENT', company: '',
    // Employee bio
    linkedinUrl: '', githubUrl: '', specialization: '',
    yearsOfExperience: '', experienceProof: '',
    projects: [{ ...EMPTY_PROJECT }, { ...EMPTY_PROJECT }, { ...EMPTY_PROJECT }],
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const isEmployee = form.role === 'EMPLOYEE'

  const updateProject = (idx, field, value) => {
    const updated = form.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    setForm({ ...form, projects: updated })
  }

  const addProject = () => setForm({ ...form, projects: [...form.projects, { ...EMPTY_PROJECT }] })
  const removeProject = (idx) => {
    if (form.projects.length <= 3) return toast.error('Minimum 3 projects required')
    setForm({ ...form, projects: form.projects.filter((_, i) => i !== idx) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      company: form.company.trim(),
    }

    if (payload.name.length < 2) return toast.error('Enter your full name')
    if (!EMAIL_REGEX.test(payload.email)) return toast.error('Enter a valid email address')
    if (!isEmployee && payload.company.length < 2) return toast.error('Enter your company name')
    if (payload.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (payload.password !== form.confirmPassword) return toast.error('Passwords do not match')

    if (isEmployee) {
      if (!form.linkedinUrl.trim()) return toast.error('LinkedIn URL is required')
      if (!form.githubUrl.trim()) return toast.error('GitHub URL is required')
      if (!form.specialization.trim()) return toast.error('Specialization is required')
      if (form.projects.length < 3) return toast.error('At least 3 projects are required')
      for (let i = 0; i < form.projects.length; i++) {
        if (!form.projects[i].title.trim()) return toast.error(`Project ${i + 1}: title is required`)
        if (!form.projects[i].description.trim()) return toast.error(`Project ${i + 1}: description is required`)
      }
      payload.linkedinUrl = form.linkedinUrl.trim()
      payload.githubUrl = form.githubUrl.trim()
      payload.specialization = form.specialization.trim()
      payload.yearsOfExperience = Number(form.yearsOfExperience) || 0
      payload.experienceProof = form.experienceProof.trim()
      payload.projects = form.projects
    }

    setLoading(true)
    try {
      await authAPI.register(payload)
      toast.success('Account created! Please login.')
      navigate('/login', { replace: true, state: { email: payload.email, fromRegister: true } })
    } catch (err) {
      const msg = err.response?.data?.message
      if (!msg || err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        toast.error('Backend not running. Please start backend, then register again.')
      } else {
        toast.error(msg || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 16 }}>
      <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: isEmployee ? 600 : 420, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <TrendingUp size={22} color="white" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.5))' }}>BidNova AuctionX</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>Join BidNova AuctionX Tracking platform</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Basic fields */}
          {[
            { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe' },
            { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@company.com' },
            ...(!isEmployee ? [{ key: 'company', label: 'Company', icon: Briefcase, type: 'text', placeholder: 'ABB Ltd.' }] : []),
            { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: 'Minimum 6 characters' },
            { key: 'confirmPassword', label: 'Confirm Password', icon: Lock, type: 'password', placeholder: 'Re-enter password' },
          ].map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <Icon size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input className="input" type={type} placeholder={placeholder} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: key === 'email' ? e.target.value.trimStart().toLowerCase() : e.target.value })}
                  style={{ paddingLeft: 30 }} required />
              </div>
            </div>
          ))}

          {/* Role selector */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="CLIENT">Client</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>

          {/* ── Employee Bio Section ── */}
          {isEmployee && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: '#60a5fa' }}>
                👷 Employee Profile — Please fill your professional details. Managers will review your profile before assigning bids.
              </div>

              {/* LinkedIn + GitHub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>LinkedIn URL *</label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#0077b5' }} />
                    <input className="input" type="text" placeholder="linkedin.com/in/yourname or https://linkedin.com/in/yourname"
                      value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                      style={{ paddingLeft: 30 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>GitHub URL *</label>
                  <div style={{ position: 'relative' }}>
                    <GitBranch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input className="input" type="text" placeholder="github.com/yourusername or https://github.com/yourusername"
                      value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                      style={{ paddingLeft: 30 }} />
                  </div>
                </div>
              </div>

              {/* Specialization + Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Specialization / Field *</label>
                  <div style={{ position: 'relative' }}>
                    <Award size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input className="input" type="text" placeholder="e.g. Electrical Engineering"
                      value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      style={{ paddingLeft: 30 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Years of Experience</label>
                  <input className="input" type="number" min="0" max="50" placeholder="e.g. 3"
                    value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
                </div>
              </div>

              {/* Experience Proof */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Experience Proof / Certifications</label>
                <textarea className="input" rows={2} placeholder="Describe your certifications, work history, or provide links to proof of experience..."
                  value={form.experienceProof} onChange={(e) => setForm({ ...form, experienceProof: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>

              {/* Projects — minimum 3 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={13} /> Projects * <span style={{ color: '#f59e0b', fontSize: 11 }}>(minimum 3 required)</span>
                  </label>
                  <button type="button" onClick={addProject}
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} /> Add Project
                  </button>
                </div>

                {form.projects.map((proj, idx) => (
                  <div key={idx} style={{ background: 'var(--color-surface2)', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Project {idx + 1}</span>
                      {form.projects.length > 3 && (
                        <button type="button" onClick={() => removeProject(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 2 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input className="input" type="text" placeholder="Project Title *"
                        value={proj.title} onChange={(e) => updateProject(idx, 'title', e.target.value)}
                        style={{ fontSize: 13 }} />
                      <textarea className="input" rows={2} placeholder="Project Description *"
                        value={proj.description} onChange={(e) => updateProject(idx, 'description', e.target.value)}
                        style={{ resize: 'none', fontSize: 13 }} />
                      <input className="input" type="text" placeholder="Tech Stack (e.g. Java, Spring Boot, React)"
                        value={proj.techStack} onChange={(e) => updateProject(idx, 'techStack', e.target.value)}
                        style={{ fontSize: 13 }} />
                      <input className="input" type="text" placeholder="Project URL (optional — github.com/... or https://...)"
                        value={proj.projectUrl} onChange={(e) => updateProject(idx, 'projectUrl', e.target.value)}
                        style={{ fontSize: 13 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', height: 40, marginTop: 4 }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        {/* Google Sign Up */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>or sign up with</span>
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

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
