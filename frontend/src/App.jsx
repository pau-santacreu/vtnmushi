import { useState, useEffect } from 'react'
import './index.css'
import api from './api'
import Icons from './components/Icons'
import AuthScreen from './components/AuthScreen'
import NotesList from './components/NotesList'
import NoteDetail from './components/NoteDetail'
import NewNoteModal from './components/NewNoteModal'
import CategoryManager from './components/CategoryManager'

export default function App() {
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [cats, setCats] = useState([])
  const [sel, setSel] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [showCats, setShowCats] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  )

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('vn_theme', next ? 'dark' : 'light')
  }

  useEffect(() => {
    const t = localStorage.getItem('vn_token')
    if (t) { api.token = t; loadUser() } else setLoading(false)

    const h = () => { setUser(null); setLoading(false) }
    window.addEventListener('vn_logout', h)
    return () => window.removeEventListener('vn_logout', h)
  }, [])

  const loadUser = async () => {
    try {
      const u = await api.get('/auth/me')
      setUser(u)
      await Promise.all([loadNotes(), loadCats()])
    } catch { localStorage.removeItem('vn_token') }
    finally { setLoading(false) }
  }

  const loadNotes = async () => {
    try { setNotes(await api.get('/notes?per_page=100')) } catch {}
  }
  const loadCats = async () => {
    try { setCats(await api.get('/categories')) } catch {}
  }

  const logout = () => {
    api.token = null
    localStorage.removeItem('vn_token')
    localStorage.removeItem('vn_refresh')
    setUser(null); setNotes([]); setSel(null)
  }

  const onCreated = (n) => { setNotes((p) => [n, ...p]); setShowNew(false); setSel(n) }
  const onUpdated = (u) => {
    setNotes((p) => p.map((n) => (n.id === u.id ? { ...n, ...u } : n)))
    setSel((p) => (p && p.id === u.id ? { ...p, ...u } : p))
  }
  const onDeleted = (id) => { setNotes((p) => p.filter((n) => n.id !== id)); setSel(null) }
  const onSelect = async (n) => {
    try { setSel(await api.get(`/notes/${n.id}`)) } catch (e) { alert(e.message) }
  }

  const filtered = notes.filter((n) => {
    if (filterCat && n.category?.id !== filterCat) return false
    if (search) {
      const s = search.toLowerCase()
      return n.title.toLowerCase().includes(s) || (n.content || '').toLowerCase().includes(s)
    }
    return true
  })

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><p>Carregant...</p></div>
  }

  if (!user) {
    return (
      <div className="app">
        <button className="theme-toggle floating" onClick={toggleTheme}>
          {dark ? Icons.sun({ size: 18 }) : Icons.moon({ size: 18 })}
        </button>
        <AuthScreen onLogin={loadUser} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          {sel && (
            <button className="btn-icon header-back" onClick={() => setSel(null)}>
              {Icons.back()}
            </button>
          )}
          <div className="brand">{Icons.wave({ size: 24 })}<span>VoiceNotes</span></div>
        </div>
        {!sel && (
          <div className="header-search">
            {Icons.search({ size: 16 })}
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cercar notes..." />
            {search && (
              <button className="btn-icon btn-sm" onClick={() => setSearch('')}>
                {Icons.x({ size: 14 })}
              </button>
            )}
          </div>
        )}
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {dark ? Icons.sun({ size: 18 }) : Icons.moon({ size: 18 })}
          </button>
          <span className="user-name">{user.username}</span>
          <button className="btn-icon" onClick={logout} title="Sortir">
            {Icons.logout({ size: 18 })}
          </button>
        </div>
      </header>

      <main className="app-main">
        {sel ? (
          <NoteDetail note={sel} onBack={() => setSel(null)}
            onUpdated={onUpdated} onDeleted={onDeleted} categories={cats} />
        ) : (
          <>
            <div className="category-chips">
              {cats.length > 0 && (
                <>
                  <button className={`chip ${!filterCat ? 'active' : ''}`}
                    onClick={() => setFilterCat('')}>Totes</button>
                  {cats.map((c) => (
                    <button key={c.id}
                      className={`chip ${filterCat === c.id ? 'active' : ''}`}
                      onClick={() => setFilterCat(filterCat === c.id ? '' : c.id)}
                      style={filterCat === c.id ? { background: c.color || 'var(--accent)', color: '#fff' } : {}}>
                      {c.name}
                    </button>
                  ))}
                </>
              )}
              <button className="chip-add" onClick={() => setShowCats(true)}>
                {Icons.plus({ size: 14 })} Categories
              </button>
            </div>
            <NotesList notes={filtered} onSelect={onSelect} searchTerm={search} />
            <button className="fab" onClick={() => setShowNew(true)}>
              {Icons.plus({ size: 28 })}
            </button>
          </>
        )}
      </main>

      {showNew && (
        <NewNoteModal onClose={() => setShowNew(false)} onCreated={onCreated} categories={cats} />
      )}

      {showCats && (
        <CategoryManager categories={cats} onClose={() => setShowCats(false)}
          onUpdated={() => { loadCats(); loadNotes() }} />
      )}
    </div>
  )
}
