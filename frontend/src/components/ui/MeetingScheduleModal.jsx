import { useState } from 'react'
import { X, Video, Calendar, Clock, User } from 'lucide-react'
import { meetingsAPI } from '../../api/meetings'
import toast from 'react-hot-toast'

const VIDEO_PLATFORMS = [
  { id: 'GOOGLE_MEET', label: 'Google Meet', color: '#4285F4' },
  { id: 'WHATSAPP', label: 'WhatsApp Video', color: '#25D366' },
  { id: 'ZOOM', label: 'Zoom', color: '#0B5CFF' },
  { id: 'TEAMS', label: 'Microsoft Teams', color: '#6264A7' },
  { id: 'CUSTOM', label: 'Custom Link', color: '#8B5CF6' },
]

export default function MeetingScheduleModal({ bidId, clientId, clientName, clientEmail, onClose, onSuccess }) {
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('GOOGLE_MEET')
  const [videoLink, setVideoLink] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSchedule = async (e) => {
    e.preventDefault()

    if (!title || !scheduledDate || !scheduledTime) {
      toast.error('Please fill all required fields')
      return
    }

    if (platform !== 'CUSTOM' && !videoLink) {
      toast.error('Please provide video meeting link')
      return
    }

    try {
      setLoading(true)
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

      const meetingData = {
        bidId,
        clientId,
        clientName,
        clientEmail,
        title,
        videoplatform: platform,
        videoLink: videoLink || `https://meet.google.com/new-meeting-${Date.now()}`,
        scheduledTime: scheduledDateTime,
        notes,
        status: 'SCHEDULED',
      }

      await meetingsAPI.scheduleMeeting(meetingData)
      toast.success('Meeting scheduled successfully!')
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={20} color="#3b82f6" />
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Schedule Video Meeting</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              fontSize: 20,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSchedule} style={{ padding: 20 }}>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4, display: 'block' }}>
              Meeting Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Bid Discussion"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface2)',
                color: 'var(--color-text)',
                fontSize: 14,
              }}
            />
          </div>

          {/* Client Info */}
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <User size={14} color="#60a5fa" />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Meeting with</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text)' }}>{clientName}</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{clientEmail}</p>
          </div>

          {/* Platform Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8, display: 'block' }}>
              Video Platform *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {VIDEO_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: platform === p.id ? `2px solid ${p.color}` : '1px solid var(--color-border)',
                    background: platform === p.id ? `${p.color}15` : 'var(--color-surface2)',
                    color: platform === p.id ? p.color : 'var(--color-text)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Video Link */}
          {platform !== 'CUSTOM' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4, display: 'block' }}>
                Meeting Link *
              </label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder={`Paste your ${VIDEO_PLATFORMS.find(p => p.id === platform)?.label} link`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface2)',
                  color: 'var(--color-text)',
                  fontSize: 14,
                }}
              />
            </div>
          )}

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4, display: 'block' }}>
                Date *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface2)',
                  color: 'var(--color-text)',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4, display: 'block' }}>
                Time *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface2)',
                  color: 'var(--color-text)',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4, display: 'block' }}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add meeting agenda or notes..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface2)',
                color: 'var(--color-text)',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
