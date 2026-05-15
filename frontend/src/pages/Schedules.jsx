import { useEffect, useState } from 'react'
import { scheduleAPI } from '../utils/api'
import { Zap, Search, Clock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  running: { bar: '#22D98A', label: 'On Time', cls: 'pill-green' },
  scheduled: { bar: '#00C8FF', label: 'Scheduled', cls: 'pill-blue' },
  delayed: { bar: '#FFB800', label: 'Delayed', cls: 'pill-orange' },
  cancelled: { bar: '#FF4444', label: 'Cancelled', cls: 'pill-red' },
  completed: { bar: '#8A9AB5', label: 'Completed', cls: 'pill-gray' },
}

function ScheduleCard({ s }) {
  const sc = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled
  const progress = s.status === 'running' ? Math.floor(Math.random() * 60 + 20)
    : s.status === 'completed' ? 100 : s.status === 'cancelled' ? 0 : 5
  return (
    <div className="card p-4 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
      style={{ borderTop: `2px solid ${sc.bar}` }}>
      <div className="flex items-start justify-between mb-1">
        <div className="font-display font-bold text-sm">Route {s.route?.routeNo}</div>
        <span className={sc.cls}>{sc.label}</span>
      </div>
      <div className="text-[11px] text-[#4A5A75] mb-3 flex items-center gap-1">
        <span>{s.route?.startStop}</span>
        <span>→</span>
        <span>{s.route?.endStop}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          ['Bus', s.bus?.busId, 'font-mono text-accent'],
          ['Driver', s.driver?.name?.split(' ')[0], ''],
          ['Departs', s.departureTime, 'font-mono'],
          ['ETA', s.estimatedArrival, 'font-mono'],
        ].map(([l, v, cls]) => (
          <div key={l}>
            <div className="text-[9px] text-[#4A5A75] uppercase tracking-wider font-mono">{l}</div>
            <div className={`text-xs text-white mt-0.5 ${cls}`}>{v || '—'}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-[#4A5A75] mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-surface3 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: sc.bar }} />
        </div>
      </div>
    </div>
  )
}

export default function Schedules() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({})
  const [genResult, setGenResult] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [s, st] = await Promise.all([scheduleAPI.getAll(), scheduleAPI.getStats()])
      setSchedules(s)
      setStats(st)
    } catch { toast.error('Failed to load schedules') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      const result = await scheduleAPI.generate()
      setGenResult(result)
      toast.success(`Schedule generated! ${result.assignmentsCreated} assignments`)
      await load()
    } catch (e) {
      toast.error(e.error || 'Failed to generate schedule')
    } finally { setGenerating(false) }
  }

  const filtered = schedules.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || s.bus?.busId?.toLowerCase().includes(q) ||
      s.route?.routeNo?.toLowerCase().includes(q) ||
      s.driver?.name?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <div className="p-6 space-y-5 animate-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={generate} disabled={generating}
          className="btn-primary flex items-center gap-2">
          <Zap size={14} />
          {generating ? 'Generating...' : 'Auto-Generate Schedule'}
        </button>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5A75]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-8 w-56" placeholder="Search route, bus, driver..." />
        </div>
        <div className="flex gap-1">
          {['all', 'running', 'scheduled', 'delayed', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] px-3 py-1.5 rounded-lg capitalize transition-all ${filter === f ? 'bg-accent text-black font-bold' : 'text-[#8A9AB5] hover:text-white hover:bg-surface2'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={load} className="btn-outline flex items-center gap-2">
          <RefreshCw size={13} />
          Refresh
        </button>
        <span className="text-[11px] text-[#4A5A75] font-mono">
          Last gen: Today 02:00 AM
        </span>
      </div>

      {/* Gen result banner */}
      {genResult && (
        <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-xl">✅</div>
          <div className="flex-1 text-sm text-accent3">
            <strong>Schedule Generated!</strong> {genResult.assignmentsCreated} assignments across {genResult.totalRoutes} routes.
            Coverage: <strong>{genResult.coverage}</strong>. Conflicts: {genResult.conflicts}.
          </div>
          <button onClick={() => setGenResult(null)} className="text-[#4A5A75] hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Stats mini row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          ['Total', stats.total || 0, '#00C8FF'],
          ['Running', stats.running || 0, '#22D98A'],
          ['Delayed', stats.delayed || 0, '#FFB800'],
          ['Completed', stats.completed || 0, '#8A9AB5'],
          ['On-Time', `${stats.onTimeRate || 0}%`, '#22D98A'],
        ].map(([l, v, c]) => (
          <div key={l} className="card px-4 py-3 text-center" style={{ borderTop: `1px solid ${c}30` }}>
            <div className="font-display font-bold text-xl" style={{ color: c }}>{v}</div>
            <div className="text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Schedule grid */}
      {loading ? (
        <div className="text-center py-12 text-[#4A5A75] font-mono text-sm">Loading schedules...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Clock size={32} className="text-[#4A5A75] mx-auto mb-3" />
          <div className="text-[#4A5A75] font-mono text-sm">No schedules found.</div>
          <div className="text-[#4A5A75] text-xs mt-1">Click "Auto-Generate Schedule" to create today's duty roster.</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(s => <ScheduleCard key={s._id} s={s} />)}
        </div>
      )}
    </div>
  )
}
