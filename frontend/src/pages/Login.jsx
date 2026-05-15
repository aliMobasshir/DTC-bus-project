import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('admin@dtc.delhi.gov.in')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative z-10">
      <div className="w-full max-w-sm px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center font-mono font-bold text-black text-lg mx-auto mb-4">
            DTC
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">DTC Command</h1>
          <p className="text-[#4A5A75] text-sm">Delhi Transport Corporation — Operations Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-[11px] text-[#4A5A75] font-mono uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input w-full"
              placeholder="admin@dtc.delhi.gov.in"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#4A5A75] font-mono uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo creds */}
        <div className="mt-4 card p-4">
          <p className="text-[11px] text-[#4A5A75] font-mono mb-2">DEMO CREDENTIALS</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#8A9AB5]">Admin:</span>
              <span className="font-mono text-accent text-[11px]">admin@dtc.delhi.gov.in / admin123</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8A9AB5]">Operator:</span>
              <span className="font-mono text-accent text-[11px]">operator@dtc.delhi.gov.in / operator123</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#4A5A75] mt-4">
          <button onClick={() => window.open('/passenger', '_blank')} className="text-accent hover:underline">
            Open Passenger App →
          </button>
        </p>
      </div>
    </div>
  )
}
