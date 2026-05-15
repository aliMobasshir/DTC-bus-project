import { useState } from 'react'
import { routeAPI } from '../utils/api'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { Search, MapPin, Clock, Bus, ArrowRight, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'

const stopIcon = (type) => L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;border-radius:50%;background:${type === 'current' ? '#00C8FF' : type === 'passed' ? '#22D98A' : '#4A5A75'};border:2px solid rgba(255,255,255,0.5)"></div>`,
  iconSize: [10, 10], iconAnchor: [5, 5]
})

export default function Passenger() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const POPULAR = [
    ['Connaught Place', 'AIIMS'],
    ['Kashmere Gate', 'Dwarka'],
    ['Rohini', 'Connaught Place'],
    ['Noida', 'Connaught Place'],
  ]

  const search = async (f, t) => {
    const fromVal = f || from
    const toVal = t || to
    if (!fromVal.trim() || !toVal.trim()) { toast.error('Enter both source and destination'); return }
    setSearching(true)
    setSearched(true)
    setSelected(null)
    try {
      const data = await routeAPI.search(fromVal, toVal)
      setResults(data)
      if (data.length === 0) toast('No direct routes found. Try nearby stops.', { icon: '🔍' })
    } catch { toast.error('Search failed') }
    finally { setSearching(false) }
  }

  const selectedRoute = selected ? results.find(r => r._id === selected) : null
  const stops = selectedRoute?.stops?.sort((a, b) => a.sequence - b.sequence) || []
  const polyline = stops.map(s => [s.lat, s.lng])
  const mapCenter = stops.length > 0 ? [stops[Math.floor(stops.length / 2)].lat, stops[Math.floor(stops.length / 2)].lng] : [28.6139, 77.2090]

  return (
    <div className="min-h-screen bg-bg relative z-10">
      {/* Header */}
      <div className="bg-surface border-b border-white/[0.07] px-6 py-4 flex items-center gap-4">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-mono text-xs font-bold text-black flex-shrink-0">DTC</div>
        <div>
          <div className="font-display font-bold text-sm">DTC Passenger</div>
          <div className="text-[10px] text-[#4A5A75] font-mono">Real-time bus tracker</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Search card */}
        <div className="card p-6">
          <h1 className="font-display font-bold text-xl mb-1">Where are you going?</h1>
          <p className="text-sm text-[#8A9AB5] mb-5">Search live DTC bus routes across Delhi</p>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
              <input value={from} onChange={e => setFrom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="input w-full pl-8" placeholder="From — e.g. Connaught Place" />
            </div>
            <div className="relative flex-1 min-w-48">
              <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent3" />
              <input value={to} onChange={e => setTo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="input w-full pl-8" placeholder="To — e.g. AIIMS" />
            </div>
            <button onClick={() => search()} disabled={searching}
              className="btn-primary flex items-center gap-2 px-6">
              <Search size={14} />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Popular routes */}
          <div className="mt-4">
            <div className="text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider mb-2">Popular Routes</div>
            <div className="flex gap-2 flex-wrap">
              {POPULAR.map(([f, t]) => (
                <button key={f+t} onClick={() => { setFrom(f); setTo(t); search(f, t) }}
                  className="flex items-center gap-1.5 text-[11px] text-[#8A9AB5] hover:text-white bg-surface2 hover:bg-surface3 border border-white/[0.07] px-3 py-1.5 rounded-full transition-all">
                  <span>{f}</span>
                  <ArrowRight size={10} />
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-4">
            {results.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm">{results.length} route{results.length > 1 ? 's' : ''} found</span>
                  <span className="pill-green">Live</span>
                </div>
                <div className="space-y-2">
                  {results.map(r => (
                    <div key={r._id}
                      onClick={() => setSelected(selected === r._id ? null : r._id)}
                      className={`card p-4 cursor-pointer transition-all hover:border-white/20 ${selected === r._id ? 'border-accent/40 bg-cyan-500/5' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface2 border border-white/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                          <span className="font-mono text-sm font-bold text-accent leading-none">{r.routeNo}</span>
                          <span className="text-[9px] text-[#4A5A75] mt-0.5">DTC</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white mb-0.5">{r.name}</div>
                          <div className="text-[11px] text-[#4A5A75]">
                            {r.startStop} → {r.endStop} · {r.stops?.length || 0} stops · {r.totalDistance} km
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-display font-bold text-xl text-accent3">{r.nextBusIn} min</div>
                          <div className="text-[10px] text-[#4A5A75] font-mono">NEXT BUS</div>
                          <div className="text-[11px] text-[#8A9AB5] mt-0.5">~{r.avgDuration} min journey</div>
                        </div>
                      </div>
                      {selected === r._id && (
                        <div className="mt-3 pt-3 border-t border-white/[0.07] text-[11px] text-[#8A9AB5]">
                          Stops: {r.stops?.map(s => s.name).join(' → ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              !searching && (
                <div className="card p-8 text-center">
                  <Bus size={32} className="text-[#4A5A75] mx-auto mb-3" />
                  <div className="text-[#8A9AB5] text-sm">No direct routes found for this combination.</div>
                  <div className="text-[#4A5A75] text-xs mt-1">Try nearby landmark names like "Connaught Place", "AIIMS", "Rohini".</div>
                </div>
              )
            )}

            {/* Map */}
            {selectedRoute && stops.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
                  <span className="font-display font-bold text-sm">Route {selectedRoute.routeNo} — Live Map</span>
                  <span className="pill-green">● Live</span>
                </div>
                <div style={{ height: 320 }}>
                  <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {polyline.length > 1 && <Polyline positions={polyline} color="#00C8FF" weight={3} opacity={0.7} dashArray="6,4" />}
                    {stops.map((s, i) => (
                      <Marker key={i} position={[s.lat, s.lng]} icon={stopIcon(i === 0 ? 'current' : 'upcoming')}>
                        <Popup>
                          <div className="text-xs">
                            <div className="font-bold font-mono">{s.name}</div>
                            <div className="text-[#8A9AB5]">Stop {s.sequence} · ETA +{s.estimatedMinutes} min</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                {/* Stop list */}
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {stops.map((s, i) => (
                    <div key={i} className="flex items-center gap-1 flex-shrink-0">
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto ${i === 0 ? 'bg-accent' : i === stops.length-1 ? 'bg-accent3' : 'bg-[#4A5A75]'}`} />
                        <div className="text-[9px] text-[#4A5A75] mt-1 max-w-16 text-center leading-tight">{s.name.split(' ')[0]}</div>
                      </div>
                      {i < stops.length - 1 && <div className="w-8 h-px bg-[#1A2540] flex-shrink-0 mb-3" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!searched && (
          <div className="text-center py-12">
            <Bus size={40} className="text-[#4A5A75] mx-auto mb-3" />
            <div className="text-[#8A9AB5] font-mono text-sm">Enter your journey to find live DTC buses</div>
          </div>
        )}
      </div>
    </div>
  )
}
