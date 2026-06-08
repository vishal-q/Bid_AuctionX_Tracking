import { useState } from 'react'
import { User, Mail, Briefcase, Building, Save, Lock, Link as LinkIcon, GitBranch, Award, Plus, Trash2, BookOpen } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../api/auth'
import toast from 'react-hot-toast'

const EMPTY_PROJECT = { title: '', description: '', techStack: '', projectUrl: '' }

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const isEmployee = user?.role === 'EMPLOYEE'

  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    company: user?.company || '', phone: user?.phone || '',
    linkedinUrl: user?.linkedinUrl || '',
    githubUrl: user?.githubUrl || '',
    specialization: user?.specialization || '',
    yearsOfExperience: user?.yearsOfExperience || '',
    experienceProof: user?.experienceProof || '',
    projects: user?.projects?.length > 0 ? user.projects : [{ ...EMPTY_PROJECT }, { ...EMPTY_PROJECT }, { ...EMPTY_PROJECT }],
  })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const updateProject = (idx, field, value) => {
    const updated = form.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    setForm({ ...form, projects: updated })
  }
  const addProject = () => setForm({ ...form, projects: [...form.projects, { ...EMPTY_PROJECT }] })
  const removeProject = (idx) => {
    if (form.projects.length <= 3) return toast.error('Minimum 3 projects required')
    setForm({ ...form, projects: form.projects.filter((_, i) => i !== idx) })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (isEmployee) {
      if (!form.linkedinUrl.trim()) return toast.error('LinkedIn URL is required')
      if (!form.githubUrl.trim()) return toast.error('GitHub URL is required')
      if (!form.specialization.trim()) return toast.error('Specialization is required')
      if (form.projects.length < 3) return toast.error('At least 3 projects required')
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name, company: form.company, phone: form.phone,
        ...(isEmployee && {
          linkedinUrl: form.linkedinUrl, githubUrl: form.githubUrl,
          specialization: form.specialization,
          yearsOfExperience: Number(form.yearsOfExperience) || 0,
          experienceProof: form.experienceProof,
          projects: form.projects,
        })
      }
      await authAPI.updateProfile(payload)
      updateUser(payload)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) return toast.error('Fill all password fields')
    if (pwForm.newPw.length < 6) return toast.error('New password must be at least 6 characters')
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Passwords do not match')
    try {
      await authAPI.changePassword({ current: pwForm.current, newPassword: pwForm.newPw })
      setPwForm({ current: '', newPw: '', confirm: '' })
      toast.success('Password updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Profile Settings</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Manage your account information</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{user?.role} · {user?.company}</p>
          <p style={{ color: '#60a5fa', fontSize: 12, marginTop: 4 }}>{user?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="card">
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Personal Information</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'name', label: 'Full Name', icon: User, type: 'text' },
              { key: 'email', label: 'Email', icon: Mail, type: 'email' },
              { key: 'company', label: 'Company', icon: Building, type: 'text' },
              { key: 'phone', label: 'Phone', icon: Briefcase, type: 'tel' },
            ].map(({ key, label, icon: Icon, type }) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                  <input className="input" type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ paddingLeft: 30 }} />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Role</label>
            <input className="input" value={user?.role || ''} disabled style={{ opacity: 0.6 }} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Employee Bio Section ── */}
      {isEmployee && (
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={15} color="#3b82f6" /> Professional Profile
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 }}>
            Managers review this to assign you bids. Keep it updated.
          </p>

          {/* LinkedIn + GitHub */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Specialization *</label>
              <input className="input" type="text" placeholder="e.g. Electrical Engineering"
                value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Years of Experience</label>
              <input className="input" type="number" min="0" max="50" placeholder="e.g. 3"
                value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
            </div>
          </div>

          {/* Experience Proof */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>Experience Proof / Certifications</label>
            <textarea className="input" rows={2} placeholder="Certifications, work history, or links to proof..."
              value={form.experienceProof} onChange={(e) => setForm({ ...form, experienceProof: e.target.value })}
              style={{ resize: 'vertical' }} />
          </div>

          {/* Projects */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={13} /> Projects <span style={{ color: '#f59e0b', fontSize: 11 }}>(min 3)</span>
              </label>
              <button type="button" onClick={addProject}
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Add
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
                    value={proj.title} onChange={(e) => updateProject(idx, 'title', e.target.value)} style={{ fontSize: 13 }} />
                  <textarea className="input" rows={2} placeholder="Description *"
                    value={proj.description} onChange={(e) => updateProject(idx, 'description', e.target.value)}
                    style={{ resize: 'none', fontSize: 13 }} />
                  <input className="input" type="text" placeholder="Tech Stack (e.g. Java, React)"
                    value={proj.techStack} onChange={(e) => updateProject(idx, 'techStack', e.target.value)} style={{ fontSize: 13 }} />
                  <input className="input" type="text" placeholder="Project URL (optional — github.com/... or https://...)"
                    value={proj.projectUrl} onChange={(e) => updateProject(idx, 'projectUrl', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="card">
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Change Password</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'current', label: 'Current Password' },
            { key: 'newPw', label: 'New Password' },
            { key: 'confirm', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, display: 'block' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input className="input" type="password" value={pwForm[key]} onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })} style={{ paddingLeft: 30 }} />
              </div>
            </div>
          ))}
          <button className="btn btn-secondary" onClick={handlePassword} style={{ alignSelf: 'flex-start' }}>Update Password</button>
        </div>
      </div>
    </div>
  )
}
