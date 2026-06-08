import { useState, useEffect } from 'react'
import { discussionsAPI } from '../../api/discussions'
import { useAuthStore } from '../../store/authStore'
import './DiscussionModal.css'

export function DiscussionModal({ bidId, onClose }) {
  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState(null)
  const [pollingInterval, setPollingInterval] = useState(null)
  const user = useAuthStore((state) => state.user)

  // Initialize discussion room
  useEffect(() => {
    const initRoom = async () => {
      try {
        setLoading(true)
        const response = await discussionsAPI.createOrGetRoom(bidId)
        setRoomId(response.data.roomId)
        setError(null)
      } catch (err) {
        setError('Failed to initialize discussion room')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initRoom()
  }, [bidId])

  // Poll messages
  useEffect(() => {
    if (!roomId) return

    const fetchMessages = async () => {
      try {
        const response = await discussionsAPI.getMessages(roomId)
        setMessages(response.data || [])
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }

    // Fetch immediately
    fetchMessages()

    // Set up polling every 2 seconds
    const interval = setInterval(fetchMessages, 2000)
    setPollingInterval(interval)

    return () => clearInterval(interval)
  }, [roomId])

  const handleSendMessage = async () => {
    if (!messageText.trim()) return

    try {
      await discussionsAPI.sendMessage(roomId, messageText)
      setMessageText('')
      // Refetch messages after sending
      const response = await discussionsAPI.getMessages(roomId)
      setMessages(response.data || [])
    } catch (err) {
      setError('Failed to send message')
      console.error(err)
    }
  }

  const handleClose = () => {
    if (pollingInterval) clearInterval(pollingInterval)
    onClose()
  }

  return (
    <div className="discussion-modal-overlay" onClick={handleClose}>
      <div className="discussion-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="discussion-header">
          <div>
            <h3>Project Discussion</h3>
            <p className="discussion-subtitle">Chat with team about this project</p>
          </div>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Messages Container */}
        <div className="discussion-messages">
          {loading ? (
            <div className="loading-state">Loading discussion...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.senderId === user?.id ? 'own' : 'other'}`}>
                <div className="message-header">
                  <span className="sender-name">{msg.senderName}</span>
                  <span className={`sender-role role-${msg.senderRole?.toLowerCase()}`}>
                    {msg.senderRole}
                  </span>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))
          )}
        </div>

        {/* Message Composer */}
        <div className="discussion-composer">
          <input
            type="text"
            placeholder="Type your message here..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage()
            }}
            disabled={!roomId}
          />
          <button
            onClick={handleSendMessage}
            disabled={!roomId || !messageText.trim()}
            className="send-btn"
          >
            Send
          </button>
        </div>

        {/* Info Footer */}
        <div className="discussion-info">
          💬 Only Employees and Clients assigned to this project can view this discussion
        </div>
      </div>
    </div>
  )
}
