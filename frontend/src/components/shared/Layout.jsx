import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { LayoutDashboard, Calendar, AlertTriangle, Bus, LogOut, ExternalLink, ChevronRight } from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { to: '/fleet', icon: Bus, label: 'Fleet' },
]

export default function Layout() {
  const [expanded, setExpanded] = useState(false)
  const { user, logout } = useAuth()
  const { connected, alerts } = useSocket()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())

  // Update clock
  useState(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  })

  return (
    <div className="flex h-screen relative z-10 overflow-hidden">
      {/* SIDEBAR */}
      <nav
        className={`flex flex-col bg-surface border-r border-white/[0.07] transition-all duration-300 flex-shrink-0 ${expanded ? 'w-52' : 'w-16'}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 h-14 border-b border-white/[0.07] overflow-hidden`}>
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-mono text-xs font-bold text-black flex-shrink-0">
            DTC
          </div>
          {expanded && <span className="font-display font-bold text-sm text-white whitespace-nowrap">Command</span>}
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1 py-3 flex-1">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all cursor-pointer relative overflow-hidden
                ${isActive
                  ? 'text-accent bg-cyan-500/10 border-l-2 border-accent rounded-l-none'
                  : 'text-[#8A9AB5] hover:text-white hover:bg-surface2'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {expanded && <span className="text-xs font-medium whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.07] p-2 space-y-1">
          <button
            onClick={() => window.open('/passenger', '_blank')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[#8A9AB5] hover:text-white hover:bg-surface2 transition-all"
          >
            <ExternalLink size={16} className="flex-shrink-0" />
            {expanded && <span className="text-xs font-medium">Passenger App</span>}
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[#8A9AB5] hover:text-danger hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} className="flex-shrink-0" />
            {expanded && <span className="text-xs font-medium">Logout</span>}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-14 bg-surface border-b border-white/[0.07] flex items-center px-6 gap-4 flex-shrink-0">
          <div>
            <div className="font-display font-bold text-sm">Delhi Transport Corporation</div>
            <div className="text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider">Control Room Operations</div>
          </div>
          <div className="flex-1" />
          {alerts.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12} className="text-danger" />
              <span className="text-[11px] text-danger font-mono">{alerts.length} alerts</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full live-dot ${connected ? 'bg-accent3' : 'bg-danger'}`} />
            <span className={`text-[11px] font-mono ${connected ? 'text-accent3' : 'text-danger'}`}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <div className="bg-surface2 border border-white/[0.07] px-3 py-1.5 rounded-lg font-mono text-xs text-[#8A9AB5]">
            {time.toTimeString().slice(0, 8)}
          </div>
          <div className="w-8 h-8 bg-surface2 border border-white/10 rounded-full flex items-center justify-center text-xs font-bold text-accent">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
