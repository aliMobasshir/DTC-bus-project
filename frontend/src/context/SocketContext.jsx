// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [busLocations, setBusLocations] = useState([])
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || window.location.origin
    socketRef.current = io(url, { transports: ['websocket', 'polling'] })
    const s = socketRef.current

    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    s.on('bus-location-update', (locations) => {
      setBusLocations(locations)
    })

    s.on('new-incident', (incident) => {
      setIncidents(prev => [incident, ...prev.slice(0, 19)])
      setAlerts(prev => [{
        id: Date.now(), type: 'danger',
        message: `Incident reported: ${incident.type} on ${incident.route?.routeNo || 'route'}`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    })

    s.on('reroute-suggestion', (data) => {
      setAlerts(prev => [{
        id: Date.now(), type: 'info',
        message: data.message,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    })

    s.on('schedule-generated', (data) => {
      setAlerts(prev => [{
        id: Date.now(), type: 'success',
        message: `Schedule generated: ${data.assignmentsCreated} assignments, ${data.coverage} coverage`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    })

    s.on('bus-status-update', (data) => {
      if (data.status === 'breakdown') {
        setAlerts(prev => [{
          id: Date.now(), type: 'danger',
          message: `Bus ${data.busId} reported breakdown`,
          timestamp: new Date()
        }, ...prev.slice(0, 9)])
      }
    })

    return () => s.disconnect()
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, busLocations, incidents, alerts, setAlerts }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
