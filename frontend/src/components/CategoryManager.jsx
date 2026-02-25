import { useState } from 'react'
import api from '../api'
import Icons from './Icons'

const PRESET_COLORS = [
  '#E8590C', '#DC2626', '#EA580C', '#D97706',
  '#16A34A', '#059669', '#0891B2', '#2563EB',
  '#7C3AED', '#C026D3', '#DB2777', '#64748B',
]

export default function CategoryManager({ categories, onUpdated, onClose }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [error, setError] = useState('')

  const create = async () => {
    if (!name.trim()) { setError('Escriu un nom'); return }
    setError('')
    try {
      await api.post('/categories', { name: name.trim(), color })
      setName('')
      setColor(PRESET_COLORS[0])
      onUpdated()
    } catch (e) {
      setError(e.message)
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color || PRESET_COLORS[0])
  }

  const saveEdit = async () => {
    if (!editName.trim()) return
    try {
      await api.put(`/categories/${editingId}`, { name: editName.trim(), color: editColor })
      setEditingId(null)
      onUpdated()
    } catch (e) {
      alert(e.message)
    }
  }

  const remove = async (id) => {
    if (!confirm('Eliminar aquesta categoria? Les notes no es perdran.')) return
    try {
      await api.del(`/categories/${id}`)
      onUpdated()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Categories</h2>
          <button className="btn-icon" onClick={onClose}>{Icons.x()}</button>
        </div>

        <div className="modal-body">
          {/* Create new */}
          <div className="cat-create-row">
            <div className="cat-color-picker">
              {PRESET_COLORS.map((c) => (
                <button key={c} className={`color-dot ${color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
            <div className="cat-input-row">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Nova categoria..." onKeyDown={(e) => e.key === 'Enter' && create()} />
              <button className="btn-primary" onClick={create}>Afegir</button>
            </div>
            {error && <div className="error-msg">{error}</div>}
          </div>

          {/* List */}
          <div className="cat-list">
            {categories.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', padding: 20 }}>
                Encara no tens categories
              </p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="cat-item">
                {editingId === cat.id ? (
                  <div className="cat-edit">
                    <div className="cat-color-picker">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} className={`color-dot ${editColor === c ? 'selected' : ''}`}
                          style={{ background: c }} onClick={() => setEditColor(c)} />
                      ))}
                    </div>
                    <div className="cat-input-row">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()} autoFocus />
                      <button className="btn-icon accent" onClick={saveEdit}>{Icons.save({ size: 16 })}</button>
                      <button className="btn-icon" onClick={() => setEditingId(null)}>{Icons.x({ size: 16 })}</button>
                    </div>
                  </div>
                ) : (
                  <div className="cat-display">
                    <span className="cat-color-preview" style={{ background: cat.color || 'var(--accent)' }} />
                    <span className="cat-name">{cat.name}</span>
                    <div className="cat-actions">
                      <button className="btn-icon btn-sm" onClick={() => startEdit(cat)}>{Icons.edit({ size: 14 })}</button>
                      <button className="btn-icon btn-sm danger" onClick={() => remove(cat.id)}>{Icons.trash({ size: 14 })}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
