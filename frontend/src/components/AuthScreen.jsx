import { useState } from 'react'
import api from '../api'
import Icons from './Icons'

export default function AuthScreen({ onLogin }) {
  const [reg, setReg] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (reg) await api.post('/auth/register', { username, email, password })
      const d = await api.post('/auth/login', { username, password })
      api.token = d.access_token
      localStorage.setItem('vn_token', d.access_token)
      localStorage.setItem('vn_refresh', d.refresh_token)
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">{Icons.wave({ size: 36 })}</div>
          <h1>VoiceNotes</h1>
          <p className="auth-subtitle">Les teves notes, la teva veu</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          <div className="input-group">
            <label>Usuari</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="nom_usuari" required minLength={3} />
          </div>
          {reg && (
            <div className="input-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com" required />
            </div>
          )}
          <div className="input-group">
            <label>Contrasenya</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="mínim 8 caràcters" required minLength={8} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? '...' : reg ? 'Crear compte' : 'Entrar'}
          </button>
        </form>
        <button className="btn-link" onClick={() => { setReg(!reg); setError('') }}>
          {reg ? 'Ja tens compte? Entra' : "No tens compte? Registra't"}
        </button>
      </div>
    </div>
  )
}
