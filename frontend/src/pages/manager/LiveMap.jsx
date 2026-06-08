import { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { locationAPI } from '../../api/location'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { MapPin, Users, RefreshCw, Navigation, Wifi, WifiOff, AlertCircle, Info } from 'lucide-react'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ROLE_COLORS = {
  MANAGER: '#3b82f6', ADMIN: '#8b5cf6', EMPLOYEE: '#10b981', CLIENT: '#f59e0b',
}

function createRoleIcon(role) {
  const color = ROLE_COLORS[role] || '#6b7280'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="7" fill="white" opacity="0.9"/>
    <circle cx="16" cy="16" r="4" fill="${color}"/>
  </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42] })
}

const myIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;
    box-shadow:0 0 0 4px rgba(59,130,246,0.3);animation:pulse-loc 1.5s infinite;"></div>
    <style>@keyframes pulse-loc{0%,100%{box-shadow:0 0 0 4px rgba(59,130,246,0.3)}50%{box-shadow:0 0 0 10px rgba(59,130,246,0.1)}}</style>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14],
})

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], 14, { duration: 1.2 }) }, [target])
  return null
}

function LocationPopup({ loc }) {
  return (
    <div style={{ minWidth: 190 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: ROLE_COLORS[loc.role] || '#6b7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 13,
        }}>{loc.name?.[0]?.toUpperCase()}</div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13 }}>{loc.name}</p>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 999,
            background: `${ROLE_COLORS[loc.role]}20`, color: ROLE_COLORS[loc.role], fontWeight: 600,
          }}>{loc.role}</span>
        </div>
      </div>
      {loc.company && <p style={{ fontSize: 12, color: '#6b7280' }}>🏢 {loc.company}</p>}
      {loc.locationName && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>📍 {loc.locationName}</p>}
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
        {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
      </p>
      {loc.locationUpdatedAt && (
        <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
          Updated: {new Date(loc.locationUpdatedAt).toLocaleTimeString()}
        </p>
      )}
      {loc.visibleReason && (
        <p style={{ fontSize: 10, color: '#60a5fa', marginTop: 4, fontStyle: 'italic' }}>
          {loc.visibleReason}
        </p>
      )}
    </div>
  )
}

export default function LiveMap() {
  const { user } = useAuthStore()
  const [locations, setLocations] = useState([])
  const [myLocation, setMyLocation] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const watchRef = useRef(null)
  const intervalRef = useRef(null)
  const isManager = ['MANAGER', 'ADMIN'].includes(user?.role)
  const isClient = user?.role === 'CLIENT'
  const isEmployee = user?.role === 'EMPLOYEE'

  const fetchLocations = useCallback(async () => {
    try {
      // All roles use bid-context endpoint — backend handles visibility rules
      const res = await locationAPI.getBidContextLocations()
      setLocations(res.data || [])

      const myRes = await locationAPI.getMyLocation()
      const myData = myRes.data
      setSharing(myData.locationSharing || false)
      if (myData.latitude && myData.longitude) {
        setMyLocation({ lat: myData.latitude, lng: myData.longitude, name: myData.locationName })
      }
    } catch (err) {
      console.error('Failed to fetch locations', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
    intervalRef.current = setInterval(fetchLocations, 30000)
    return () => {
      clearInterval(intervalRef.current)
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [fetchLocations])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setMyLocation(prev => ({ ...prev, lat: latitude, lng: longitude }))
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown'
          await locationAPI.updateLocation({ latitude, longitude, locationName, locationSharing: true })
          setMyLocation({ lat: latitude, lng: longitude, name: locationName })
        } catch {
          await locationAPI.updateLocation({ latitude, longitude, locationSharing: true })
        }
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
  }, [])

  const stopTracking = useCallback(() => {
    if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null }
  }, [])

  const toggleSharing = async () => {
    const newSharing = !sharing
    try {
      await locationAPI.toggleSharing(newSharing)
      setSharing(newSharing)
      if (newSharing) { startTracking(); toast.success('Location sharing enabled — visible to relevant team members') }
      else { stopTracking(); toast.success('Location sharing disabled') }
    } catch { toast.error('Failed to update location sharing') }
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setMyLocation({ lat: latitude, lng: longitude })
        setFlyTarget({ lat: latitude, lng: longitude })
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const locationName = data.address?.city || data.address?.town || data.address?.county || 'Unknown'
          await locationAPI.updateLocation({ latitude, longitude, locationName, locationSharing: sharing })
          setMyLocation({ lat: latitude, lng: longitude, name: locationName })
          toast.success(`Located: ${locationName}`)
        } catch {
          await locationAPI.updateLocation({ latitude, longitude, locationSharing: sharing })
        }
      },
      () => toast.error('Could not get your location')
    )
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLocations()
    setRefreshing(false)
    toast.success('Locations refreshed')
  }

  const filteredLocations = filter === 'ALL'
    ? locations
    : locations.filter(l => l.role === filter)

  const roleCounts = {
    ALL: locations.length,
    MANAGER: locations.filter(l => l.role === 'MANAGER' || l.role === 'ADMIN').length,
    EMPLOYEE: locations.filter(l => l.role === 'EMPLOYEE').length,
    CLIENT: locations.filter(l => l.role === 'CLIENT').length,
  }

  const defaultCenter = myLocation
    ? [myLocation.lat, myLocation.lng]
    : filteredLocations.length > 0
      ? [filteredLocations[0].latitude, filteredLocations[0].longitude]
      : [20.5937, 78.9629]

  // Info message per role
  const infoMsg = isClient
    ? '📍 Your location is shared with managers when you submit a bid. Employee location becomes visible after assignment.'
    : isEmployee
      ? '📍 Your location is visible to managers and clients of your assigned bids.'
      : '📍 You can see all team members who have enabled location sharing.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} color="#3b82f6" /> Live Team Map
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 2 }}>
            Bid-context location tracking · Auto-refreshes every 30s
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing} style={{ height: 36, fontSize: 13 }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={handleLocateMe} style={{ height: 36, fontSize: 13 }}>
            <Navigation size={14} /> Locate Me
          </button>
          <button onClick={toggleSharing} style={{
            height: 36, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: sharing ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
            color: sharing ? '#34d399' : '#f87171',
            border: `1px solid ${sharing ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {sharing ? <Wifi size={14} /> : <WifiOff size={14} />}
            {sharing ? 'Sharing On' : 'Sharing Off'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        padding: '10px 14px', borderRadius: 8, fontSize: 12,
        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
        color: 'var(--color-muted)', display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <Info size={14} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{infoMsg}</span>
      </div>

      {/* Client compulsory location warning */}
      {isClient && !sharing && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 12,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>
            <strong>Location sharing is required</strong> to submit bids. Please enable it using the "Sharing Off" button above.
          </span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[
          { label: 'Visible Users', value: locations.length, color: '#3b82f6' },
          { label: 'Managers', value: roleCounts.MANAGER, color: '#8b5cf6' },
          { label: 'Employees', value: roleCounts.EMPLOYEE, color: '#10b981' },
          { label: 'Clients', value: roleCounts.CLIENT, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={15} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: 16, minHeight: 500 }}>

        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12, position: 'relative' }}>
          {/* Filter pills */}
          {isManager && (
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', gap: 6 }}>
              {['ALL', 'MANAGER', 'EMPLOYEE', 'CLIENT'].map(r => (
                <button key={r} onClick={() => setFilter(r)} style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: filter === r ? (ROLE_COLORS[r] || '#3b82f6') : 'rgba(17,24,39,0.85)',
                  color: filter === r ? 'white' : 'var(--color-muted)',
                  backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  {r} ({r === 'ALL' ? roleCounts.ALL : roleCounts[r] || 0})
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)' }}>
              <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                <MapPin size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>Loading map...</p>
              </div>
            </div>
          ) : (
            <MapContainer center={defaultCenter} zoom={5} style={{ height: 500, width: '100%' }} zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              {flyTarget && <FlyTo target={flyTarget} />}

              {/* My location */}
              {myLocation && (
                <Marker position={[myLocation.lat, myLocation.lng]} icon={myIcon}>
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>📍 You ({user?.name})</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>{myLocation.name || 'Current location'}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                        {myLocation.lat?.toFixed(4)}, {myLocation.lng?.toFixed(4)}
                      </p>
                      <p style={{ fontSize: 10, color: sharing ? '#10b981' : '#f87171', marginTop: 4 }}>
                        {sharing ? '🟢 Sharing enabled' : '🔴 Sharing disabled'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Other users */}
              {filteredLocations.map(loc => (
                <Marker
                  key={loc.id}
                  position={[loc.latitude, loc.longitude]}
                  icon={createRoleIcon(loc.role)}
                  eventHandlers={{ click: () => setSelectedUser(loc) }}
                >
                  <Popup><LocationPopup loc={loc} /></Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Sidebar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={13} color="#3b82f6" />
              {isManager ? 'Team Locations' : 'Visible Contacts'}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-muted)' }}>
                {filteredLocations.length}
              </span>
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {filteredLocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-muted)' }}>
                <MapPin size={22} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 12 }}>
                  {isClient
                    ? 'No team members visible yet. Submit a bid to see manager locations.'
                    : isEmployee
                      ? 'No contacts visible yet. Locations appear when bids are assigned.'
                      : 'No users sharing location'}
                </p>
              </div>
            ) : (
              filteredLocations.map(loc => (
                <div key={loc.id}
                  onClick={() => { setSelectedUser(loc); setFlyTarget({ lat: loc.latitude, lng: loc.longitude }) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                    background: selectedUser?.id === loc.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border: `1px solid ${selectedUser?.id === loc.id ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (selectedUser?.id !== loc.id) e.currentTarget.style.background = 'var(--color-surface2)' }}
                  onMouseLeave={e => { if (selectedUser?.id !== loc.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: ROLE_COLORS[loc.role] || '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 12,
                  }}>{loc.name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {loc.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                      {loc.locationName || `${loc.latitude?.toFixed(3)}, ${loc.longitude?.toFixed(3)}`}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 9, padding: '2px 5px', borderRadius: 999, fontWeight: 700, flexShrink: 0,
                    background: `${ROLE_COLORS[loc.role]}20`, color: ROLE_COLORS[loc.role],
                  }}>{loc.role}</span>
                </div>
              ))
            )}
          </div>

          {/* My status */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: sharing ? '#10b981' : '#6b7280',
                boxShadow: sharing ? '0 0 6px #10b981' : 'none',
              }} />
              <span style={{ fontSize: 11, color: 'var(--color-muted)', flex: 1 }}>
                {sharing ? 'Your location is live' : 'Location sharing off'}
              </span>
            </div>
            {myLocation?.name && (
              <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4, paddingLeft: 16 }}>
                📍 {myLocation.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper {
          background: #1f2937 !important; color: #f9fafb !important;
          border: 1px solid #374151 !important; border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
        }
        .leaflet-popup-tip { background: #1f2937 !important; }
        .leaflet-popup-close-button { color: #9ca3af !important; }
        [data-theme="light"] .leaflet-popup-content-wrapper {
          background: #ffffff !important; color: #111827 !important;
          border: 1px solid #d6deea !important;
        }
        [data-theme="light"] .leaflet-popup-tip { background: #ffffff !important; }
      `}</style>
    </div>
  )
}
