import { useEffect, useState } from 'react'
import { incidentAPI, busAPI } from '../utils/api'
import { AlertTriangle, Plus, CheckCircle, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'

const SEV_CLASS = {
  critical: 'pill-red', high: 'pill-red', medium: 'pill-orange', low: 'pill-blue'
}
const TYPE_ICONS = {
  breakdown: '🔧', accident: '💥', traffic: '🚦', 'road-closure': '🚧', 'passenger-issue': '👤', other: '⚠️'
}

function ReportModal({ buses, onClose, onCreated }) {
  const [form, setForm] = useState({ bus: '', type: 'breakdown', severity: 'high', description: '', address: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        bus: form.bus,
        type: form.type,
        severity: form.severity,
        description: form.description,
        location: { address: form.address }
      }
      const incident = await incidentAPI.create(data)
      toast.success('Incident reported. Replacement bus search initiated.')
      onCreated(incident)
      onClose()
    } catch (e) {
      toast.error(e.error || 'Failed to report incident')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger" /> Report Incident
          </h2>
          <button onClick={onClose} className="text-[#4A5A75] hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-[#4A5A75] font-mono uppercase tracking-wider mb-1.5">Bus</label>
            <select value={form.bus} onChange={e => setForm(f => ({...f, bus: e.target.value}))}
              className="input w-full" required>
              <option value="">Select bus...</option>
              {buses.map(b => <option key={b._id} value={b._id}>{b.busId} — {b.registrationNo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#4A5A75] font-mono uppercase tracking-wider mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="input w-full">
                {['breakdown','accident','traffic','road-closure','passenger-issue','other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#4A5A75] font-mono uppercase tracking-wider mb-1.5">Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({...f, severity: e.target.value}))} className="input w-full">
                {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-[#4A5A75] font-mono uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              className="input w-full h-20 resize-none" placeholder="Describe the incident..." required />
          </div>
          <div>
            <label className="block text-[11px] text-[#4A5A75] font-mono uppercase tracking-wider mb-1.5">Location</label>
            <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
              className="input w-full" placeholder="e.g. Near Lajpat Nagar Metro" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Reporting...' : 'Report Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([])
  const [buses, setBuses] = useState([])
  const [stats, setStats] = useState({})
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [inc, bs, st] = await Promise.all([
        incidentAPI.getAll(filter !== 'all' ? { status: filter } : {}),
        busAPI.getAll(),
        incidentAPI.getStats()
      ])
      setIncidents(inc)
      setBuses(bs)
      setStats(st)
    } catch { toast.error('Failed to load incidents') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const resolve = async (id) => {
    try {
      await incidentAPI.update(id, { status: 'resolved', resolvedAt: new Date() })
      toast.success('Incident resolved')
      load()
    } catch { toast.error('Failed to resolve') }
  }

  return (
    <div className="p-6 space-y-5 animate-in">
      {showModal && <ReportModal buses={buses} onClose={() => setShowModal(false)} onCreated={() => load()} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Report Incident
        </button>
        <div className="flex gap-1">
          {['all','open','in-progress','resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] px-3 py-1.5 rounded-lg capitalize transition-all ${filter === f ? 'bg-accent text-black font-bold' : 'text-[#8A9AB5] hover:text-white hover:bg-surface2'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['Open', stats.open || 0, '#FF4444'],
          ['In Progress', stats.inProgress || 0, '#FFB800'],
          ['Breakdowns', stats.breakdowns || 0, '#FF6B35'],
          ['Resolved Today', stats.resolvedToday || 0, '#22D98A'],
        ].map(([l, v, c]) => (
          <div key={l} className="card px-4 py-3" style={{ borderTop: `2px solid ${c}` }}>
            <div className="font-display font-bold text-2xl" style={{ color: c }}>{v}</div>
            <div className="text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Incidents list */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07]">
          <span className="font-display font-bold text-sm">Incident Log</span>
        </div>
        {loading ? (
          <div className="text-center py-10 text-[#4A5A75] font-mono text-xs">Loading...</div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle size={28} className="text-accent3 mx-auto mb-2" />
            <div className="text-[#4A5A75] font-mono text-xs">No incidents. System running smoothly.</div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {incidents.map(inc => (
              <div key={inc._id} className="flex items-start gap-4 px-4 py-4 hover:bg-surface2 transition-colors">
                <div className="text-2xl mt-0.5">{TYPE_ICONS[inc.type] || '⚠️'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-white">
                      {inc.type.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className={SEV_CLASS[inc.severity] || 'pill-gray'}>{inc.severity}</span>
                    <span className={inc.status === 'resolved' ? 'pill-green' : inc.status === 'in-progress' ? 'pill-orange' : 'pill-red'}>
                      {inc.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#8A9AB5] mb-1">{inc.description}</div>
                  <div className="flex gap-3 text-[10px] text-[#4A5A75] font-mono flex-wrap">
                    {inc.bus?.busId && <span>🚌 {inc.bus.busId}</span>}
                    {inc.route?.routeNo && <span>🛣 Route {inc.route.routeNo}</span>}
                    {inc.location?.address && <span>📍 {inc.location.address}</span>}
                    {inc.replacementBus?.busId && <span className="text-accent3">✓ Replacement: {inc.replacementBus.busId}</span>}
                    <span>🕐 {new Date(inc.reportedAt).toLocaleTimeString()}</span>
                    {inc.resolvedAt && <span className="text-accent3">✓ Resolved: {new Date(inc.resolvedAt).toLocaleTimeString()}</span>}
                  </div>
                </div>
                {inc.status !== 'resolved' && (
                  <button onClick={() => resolve(inc._id)}
                    className="btn-outline flex items-center gap-1.5 flex-shrink-0 text-accent3 border-accent3/20 hover:bg-emerald-500/10">
                    <CheckCircle size={12} /> Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
