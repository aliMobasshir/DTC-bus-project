// src/pages/Fleet.jsx
import { useEffect, useState } from 'react'
import { busAPI, driverAPI } from '../utils/api'
import { Bus, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Fleet() {
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [tab, setTab] = useState('buses')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([busAPI.getAll(), driverAPI.getAll()])
      .then(([b, d]) => { setBuses(b); setDrivers(d) })
      .catch(() => toast.error('Failed to load fleet data'))
      .finally(() => setLoading(false))
  }, [])

  const busStatusPill = (s) => ({
    active: 'pill-green', dispatched: 'pill-blue', idle: 'pill-gray',
    maintenance: 'pill-orange', breakdown: 'pill-red'
  }[s] || 'pill-gray')

  const driverStatusPill = (s) => ({
    available: 'pill-green', 'on-duty': 'pill-blue', 'off-duty': 'pill-gray',
    leave: 'pill-orange', suspended: 'pill-red'
  }[s] || 'pill-gray')

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex gap-1">
        {[['buses','Buses'], ['drivers','Drivers']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-[11px] px-4 py-2 rounded-lg transition-all ${tab === k ? 'bg-accent text-black font-bold' : 'text-[#8A9AB5] hover:text-white hover:bg-surface2'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-[#4A5A75] font-mono text-xs">Loading...</div> : (
        tab === 'buses' ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Bus ID','Reg No','Type','Depot','Capacity','Odometer','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buses.map(b => (
                  <tr key={b._id} className="border-b border-white/[0.03] hover:bg-surface2 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-accent font-bold">{b.busId}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8A9AB5]">{b.registrationNo}</td>
                    <td className="px-4 py-3">
                      <span className={b.type === 'EV' ? 'pill-green' : 'pill-blue'}>{b.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8A9AB5]">{b.depot?.name?.split(' ')[0]}</td>
                    <td className="px-4 py-3 text-xs text-[#8A9AB5]">{b.capacity}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8A9AB5]">{b.odometer?.toLocaleString()} km</td>
                    <td className="px-4 py-3"><span className={busStatusPill(b.status)}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Driver ID','Name','Phone','Shift','Depot','Trips','Rating','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] text-[#4A5A75] font-mono uppercase tracking-wider bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d._id} className="border-b border-white/[0.03] hover:bg-surface2 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-accent">{d.driverId}</td>
                    <td className="px-4 py-3 text-xs text-white font-semibold">{d.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8A9AB5]">{d.phone}</td>
                    <td className="px-4 py-3 text-[11px] text-[#8A9AB5] capitalize">{d.shiftType}</td>
                    <td className="px-4 py-3 text-[11px] text-[#8A9AB5]">{d.depot?.name?.split(' ')[0]}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8A9AB5]">{d.totalTrips}</td>
                    <td className="px-4 py-3 text-[11px] text-warn font-mono">{'⭐'} {d.rating}</td>
                    <td className="px-4 py-3"><span className={driverStatusPill(d.status)}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
