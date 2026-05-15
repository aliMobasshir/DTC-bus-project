import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { busAPI, scheduleAPI, incidentAPI, depotAPI } from '../utils/api'
import { useSocket } from '../context/SocketContext'
import { AlertTriangle, Bus, Clock, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

// Custom bus marker icons
const createBusIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.4);box-shadow:0 0 8px ${color}"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})
const icons = {
  active: createBusIcon('#22D98A'),
  delayed: createBusIcon('#FFB800'),
  breakdown: createBusIcon('#FF4444'),
  dispatched: createBusIcon('#00C8FF'),
}

function StatCard({ label, value, sub, subUp, icon: Icon, accentColor }) {
  return (
    <div className="card p-4 relative overflow-hidden cursor-pointer hover:border-white/20 transition-all group"
      style={{ borderTop: `2px solid ${accentColor}` }}>
      <div className="text-[10px] text-[#4A5A75] font-mono uppercase tracking-widest mb-2">{label}</div>
      <div className="font-display font-bold text-3xl text-white mb-1">{value}</div>
      {sub && <div className={`text-[11px] ${subUp ? 'text-accent3' : 'text-danger'}`}>{sub}</div>}
      <Icon size={28} className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity" style={{ color: accentColor }} />
    </div>
  )
}

export default function Dashboard() {
  const { busLocations, alerts, connected } = useSocket()
  const [stats, setStats] = useState({ total: 0, onRoute: 0, delayed: 0, breakdown: 0 })
  const [schedStats, setSchedStats] = useState({ onTimeRate: 87 })
  const [incidents, setIncidents] = useState([])
  const [depots, setDepots] = useState([])
  const [todaySchedules, setTodaySchedules] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [bs, ss, inc, dep, sched] = await Promise.all([
        busAPI.getStats(),
        scheduleAPI.getStats(),
        incidentAPI.getAll({ status: 'open' }),
        depotAPI.getAll(),
        scheduleAPI.getAll(),
      ])
      setStats(bs)
      setSchedStats(ss)
      setIncidents(inc.slice(0, 6))
      setDepots(dep.slice(0, 5))
      setTodaySchedules(sched.slice(0, 6))
    } catch (e) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const statusPill = (s) => {
    const map = { running: 'pill-green', scheduled: 'pill-blue', delayed: 'pill-orange', cancelled: 'pill-red', completed: 'pill-gray' }
    return <span className={map[s] || 'pill-gray'}>{s}</span>
  }

  return (
    <div className="p-6 space-y-5 animate-in">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Buses On Route" value={stats.onRoute || 0} sub="↑ +12 from yesterday" subUp icon={Bus} accentColor="#22D98A" />
        <StatCard label="Delayed" value={stats.delayed || 0} sub="↑ 4 more than usual" icon={Clock} accentColor="#FFB800" />
        <StatCard label="Breakdowns" value={stats.breakdown || 0} sub="↓ 2 less than avg" subUp icon={AlertTriangle} accentColor="#FF4444" />
        <StatCard label="On-Time Rate" value={`${schedStats.onTimeRate}%`} sub="↑ +3% this week" subUp icon={TrendingUp} accentColor="#00C8FF" />
      </div>

      {/* Map + Alerts */}
      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Live Map */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
            <span className="font-display font-bold text-sm">Live Fleet — Delhi</span>
            <span className="pill-blue">● LIVE</span>
            <div className="flex-1" />
            <span className="text-[11px] text-[#4A5A75] font-mono">{busLocations.length} buses tracked</span>
          </div>
          <div style={{ height: 340 }}>
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              {busLocations.map((bus, i) => (
                <Marker
                  key={bus._id || i}
                  position={[bus.lat, bus.lng]}
                  icon={icons[bus.status] || icons.active}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold font-mono text-accent">{bus.busId}</div>
                      <div>Route: <span className="font-mono">{bus.routeNo}</span></div>
                      <div>Speed: {bus.speed} km/h</div>
                      <div>Next: {bus.nextStop}</div>
                      <div>Status: <span className={bus.status === 'active' ? 'text-accent3' : 'text-warn'}>{bus.status}</span></div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {/* Legend */}
          <div className="flex gap-4 px-4 py-2 border-t border-white/[0.07]">
            {[['#22D98A','On Route'], ['#FFB800','Delayed'], ['#FF4444','Breakdown'], ['#00C8FF','Dispatched']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                <span className="text-[10px] text-[#8A9AB5] font-mono">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Panel */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <span className="font-display font-bold text-sm">Live Alerts</span>
            {incidents.filter(i => i.severity === 'high' || i.severity === 'critical').length > 0 && (
              <span className="pill-red">{incidents.filter(i => i.severity === 'high').length} Critical</span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1.5">
            {/* Socket alerts */}
            {alerts.map(a => (
              <div key={a.id} className={`p-2.5 rounded-lg border-l-2 text-xs ${
                a.type === 'danger' ? 'border-danger bg-red-500/5' :
                a.type === 'success' ? 'border-accent3 bg-emerald-500/5' :
                'border-accent bg-cyan-500/5'
              }`}>
                <div className="text-[#8A9AB5]">{a.message}</div>
                <div className="text-[10px] text-[#4A5A75] font-mono mt-0.5">
                  {a.timestamp?.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {/* DB incidents */}
            {incidents.map(inc => (
              <div key={inc._id} className={`p-2.5 rounded-lg border-l-2 ${
                inc.severity === 'critical' || inc.severity === 'high' ? 'border-danger bg-red-500/5' :
                inc.severity === 'medium' ? 'border-warn bg-amber-500/5' : 'border-accent bg-cyan-500/5'
              }`}>
                <div className="text-[11px] font-semibold font-mono text-white">
                  {inc.route?.routeNo ? `Route ${inc.route.routeNo}` : 'System'} — {inc.bus?.busId}
                </div>
                <div className="text-[11px] text-[#8A9AB5] mt-0.5">{inc.description?.slice(0, 60)}...</div>
                <div className="text-[10px] text-[#4A5A75] font-mono mt-0.5">
                  {new Date(inc.reportedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {alerts.length === 0 && incidents.length === 0 && (
              <div className="text-center text-[#4A5A75] text-xs py-8 font-mono">No active alerts</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <span className="font-display font-bold text-sm">Today's Schedule</span>
            <span className="pill-green">{schedStats.total || 0} total</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Bus', 'Route', 'Driver', 'Departs', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider bg-surface2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todaySchedules.map(s => (
                <tr key={s._id} className="border-b border-white/[0.03] hover:bg-surface2 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-accent">{s.bus?.busId}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8A9AB5]">{s.route?.routeNo}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8A9AB5]">{s.driver?.name?.split(' ')[0]}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-[#8A9AB5]">{s.departureTime}</td>
                  <td className="px-4 py-2.5">{statusPill(s.status)}</td>
                </tr>
              ))}
              {todaySchedules.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[#4A5A75] text-xs font-mono">No schedules. Click "Generate" in Schedules tab.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Depot Status */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <span className="font-display font-bold text-sm">Depot Status</span>
            <span className="pill-blue">{depots.length} depots</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Depot', 'Location', 'Active', 'Idle', 'Maint.'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider bg-surface2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depots.map(d => (
                <tr key={d._id} className="border-b border-white/[0.03] hover:bg-surface2 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-semibold text-white">{d.depotId}</td>
                  <td className="px-4 py-2.5 text-[11px] text-[#8A9AB5]">{d.location.split(',')[0]}</td>
                  <td className="px-4 py-2.5 text-xs text-accent3 font-mono">{d.buses?.active || 0}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8A9AB5] font-mono">{d.buses?.idle || 0}</td>
                  <td className="px-4 py-2.5 text-xs text-warn font-mono">{d.buses?.maintenance || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
