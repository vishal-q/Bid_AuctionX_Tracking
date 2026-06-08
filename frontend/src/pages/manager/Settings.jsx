import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe, Save, Moon, Sun, Monitor } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore()
  const { user } = useAuthStore()

  const [notifSettings, setNotifSettings] = useState({
    newBid: true,
    statusChange: true,
    employeeSubmit: true,
    deadlineReminder: true,
  })

  const [displaySettings, setDisplaySettings] = useState({
    compactMode: false,
    showWinProb: true,
    showBidNumber: true,
    defaultSort: '-createdAt',
    defaultStatus: 'all',
  })

  const saveSettings = () => {
    localStorage.setItem('bidflow_notif_settings', JSON.stringify(notifSettings))
    localStorage.setItem('bidflow_display_settings', JSON.stringify(displaySettings))
    toast.success('Settings saved!')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Manage your application preferences</p>
      </div>

      {/* Appearance */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Palette size={16} color="#8b5cf6" />
          <h3 style={{ fontWeight: 600, fontSize: 14 }}>Appearance</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500 }}>Theme</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Choose between dark and light mode</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Dark', icon: Moon, value: 'dark' },
                { label: 'Light', icon: Sun, value: 'light' },
              ].map(({ label, icon: Icon, value }) => (
                <button key={value} onClick={() => theme !== value && toggleTheme()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: `1px solid ${theme === value ? '#3b82f6' : 'var(--color-border)'}`, background: theme === value ? 'rgba(59,130,246,0.1)' : 'var(--color-surface2)', color: theme === value ? '#60a5fa' : 'var(--color-muted)', fontWeight: theme === value ? 600 : 400 }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Compact Mode"
            desc="Reduce spacing for more content on screen"
            value={displaySettings.compactMode}
            onChange={(v) => setDisplaySettings({ ...displaySettings, compactMode: v })}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Bell size={16} color="#f59e0b" />
          <h3 style={{ fontWeight: 600, fontSize: 14 }}>Notification Preferences</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ToggleRow label="New Bid Submitted" desc="Notify when a client submits a new bid" value={notifSettings.newBid} onChange={(v) => setNotifSettings({ ...notifSettings, newBid: v })} />
          <ToggleRow label="Status Changes" desc="Notify when any bid status is updated" value={notifSettings.statusChange} onChange={(v) => setNotifSettings({ ...notifSettings, statusChange: v })} />
          <ToggleRow label="Employee Work Submission" desc="Notify when employee submits completed work" value={notifSettings.employeeSubmit} onChange={(v) => setNotifSettings({ ...notifSettings, employeeSubmit: v })} />
          <ToggleRow label="Deadline Reminders" desc="Notify 7 days before bid deadline" value={notifSettings.deadlineReminder} onChange={(v) => setNotifSettings({ ...notifSettings, deadlineReminder: v })} />
        </div>
      </div>

      {/* Display Preferences */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Monitor size={16} color="#3b82f6" />
          <h3 style={{ fontWeight: 600, fontSize: 14 }}>Display Preferences</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ToggleRow label="Show Win Probability" desc="Display AI win probability on bid cards" value={displaySettings.showWinProb} onChange={(v) => setDisplaySettings({ ...displaySettings, showWinProb: v })} />
          <ToggleRow label="Show Bid Numbers" desc="Display bid reference numbers on cards" value={displaySettings.showBidNumber} onChange={(v) => setDisplaySettings({ ...displaySettings, showBidNumber: v })} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500 }}>Default Sort Order</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>How bids are sorted by default</p>
            </div>
            <select className="input" value={displaySettings.defaultSort} onChange={(e) => setDisplaySettings({ ...displaySettings, defaultSort: e.target.value })} style={{ width: 180, height: 34, fontSize: 13 }}>
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="-value">Highest Value</option>
              <option value="deadline">Earliest Deadline</option>
              <option value="-aiWinProbability">Highest Win Prob</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Shield size={16} color="#10b981" />
          <h3 style={{ fontWeight: 600, fontSize: 14 }}>Account Information</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role },
            { label: 'Company', value: user?.company || '—' },
            { label: 'Auth Provider', value: user?.authProvider || 'local' },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 12px', background: 'var(--color-surface2)', borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 500 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={saveSettings} style={{ alignSelf: 'flex-start', height: 38 }}>
        <Save size={14} /> Save Settings
      </button>
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        background: value ? '#3b82f6' : 'var(--color-surface2)', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 22 : 3, width: 18, height: 18,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}
