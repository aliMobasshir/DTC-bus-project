import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Layout from './components/shared/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Schedules from './pages/Schedules'
import Passenger from './pages/Passenger'
import Incidents from './pages/Incidents'
import Fleet from './pages/Fleet'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg">
      <div className="text-center">
        <div className="text-accent font-display text-2xl font-bold mb-2">DTC Command</div>
        <div className="text-[#4A5A75] font-mono text-xs">Loading...</div>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#0D1420', color: '#E8EDF5', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'DM Sans' },
              success: { iconTheme: { primary: '#22D98A', secondary: '#080C14' } },
              error: { iconTheme: { primary: '#FF4444', secondary: '#080C14' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/passenger" element={<Passenger />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="fleet" element={<Fleet />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
