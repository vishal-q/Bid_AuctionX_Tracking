import { useEffect, useState } from 'react'
import { Video, Calendar, Clock, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react'
import { meetingsAPI } from '../../api/meetings'
import toast from 'react-hot-toast'

export default function MeetingsList() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await meetingsAPI.getUserMeetings()
      setMeetings(response.data)
    } catch (error) {
      toast.error('Failed to fetch meetings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this meeting?')) {
      try {
        await meetingsAPI.cancelMeeting(id)
        toast.success('Meeting cancelled')
        fetchMeetings()
      } catch (error) {
        toast.error('Failed to cancel meeting')
      }
    }
  }

  const handleComplete = async (id) => {
    try {
      await meetingsAPI.completeMeeting(id)
      toast.success('Meeting marked as completed')
      fetchMeetings()
    } catch (error) {
      toast.error('Failed to update meeting')
    }
  }

  const getPlatformColor = (platform) => {
    const colors = {
      GOOGLE_MEET: '#4285F4',
      WHATSAPP: '#25D366',
      ZOOM: '#0B5CFF',
      TEAMS: '#6264A7',
      CUSTOM: '#8B5CF6',
    }
    return colors[platform] || '#666'
  }

  const getStatusBadge = (status) => {
    const styles = {
      SCHEDULED: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', icon: Calendar },
      COMPLETED: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', icon: CheckCircle },
      CANCELLED: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', icon: AlertCircle },
    }
    return styles[status] || styles.SCHEDULED
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted)' }}>Loading meetings...</div>
  }

  if (meetings.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: 'var(--color-muted)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface2)',
      }}>
        <Video size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>No meetings scheduled yet</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {meetings.map((meeting) => {
        const statusStyle = getStatusBadge(meeting.status)
        const StatusIcon = statusStyle.icon
        const scheduledDate = new Date(meeting.scheduledTime)

        return (
          <div
            key={meeting.id}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{meeting.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  {meeting.clientName} ({meeting.clientEmail})
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <StatusIcon size={12} />
                  {meeting.status}
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 12,
            }}>
              {/* Date & Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Calendar size={16} color="var(--color-muted)" />
                <div>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Date & Time</p>
                  <p style={{ color: 'var(--color-text)' }}>
                    {scheduledDate.toLocaleDateString()} {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Platform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Video size={16} style={{ color: getPlatformColor(meeting.videoplatform) }} />
                <div>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Platform</p>
                  <p style={{ color: 'var(--color-text)' }}>{meeting.videoplatform.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            {/* Meeting Link */}
            {meeting.videoLink && (
              <div style={{ marginBottom: 12, padding: 10, background: 'rgba(59,130,246,0.1)', borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>Meeting Link</p>
                <a
                  href={meeting.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13,
                    color: '#60a5fa',
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                    display: 'inline-block',
                  }}
                >
                  {meeting.videoLink}
                </a>
              </div>
            )}

            {/* Notes */}
            {meeting.notes && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>Notes</p>
                <p style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{meeting.notes}</p>
              </div>
            )}

            {/* Actions */}
            {meeting.status === 'SCHEDULED' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleComplete(meeting.id)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(16,185,129,0.15)',
                    color: '#34d399',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleCancel(meeting.id)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
