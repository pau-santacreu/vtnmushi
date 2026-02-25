import { useState, useEffect, useRef } from 'react'
import api from '../api'
import Icons from './Icons'
import AudioPlayer from './AudioPlayer'
import { formatTime, formatDate } from '../utils'

export default function NoteDetail({ note, onBack, onUpdated, onDeleted, categories = [] }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [categoryId, setCategoryId] = useState(note.category?.id || '')
  const [saving, setSaving] = useState(false)
  const taRef = useRef(null)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content || '')
    setCategoryId(note.category?.id || '')
  }, [note])

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus()
      taRef.current.style.height = 'auto'
      taRef.current.style.height = taRef.current.scrollHeight + 'px'
    }
  }, [editing])

  const save = async () => {
    setSaving(true)
    try {
      const body = { title, content }
      const newCatId = categoryId || null
      const oldCatId = note.category?.id || null
      if (newCatId !== oldCatId) {
        body.category_id = newCatId
      }
      const u = await api.put(`/notes/${note.id}`, body)
      onUpdated(u)
      setEditing(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Eliminar aquesta nota?')) return
    try {
      await api.del(`/notes/${note.id}`)
      onDeleted(note.id)
    } catch (e) {
      alert(e.message)
    }
  }

  const togglePin = async () => {
    try {
      const u = await api.patch(`/notes/${note.id}/pin`)
      onUpdated(u)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="note-detail">
      <div className="detail-toolbar">
        <button className="btn-icon" onClick={onBack}>{Icons.back()}</button>
        <div className="detail-actions">
          <button className={`btn-icon ${note.is_pinned ? 'active' : ''}`} onClick={togglePin}>
            {Icons.pin()}
          </button>
          {!editing ? (
            <button className="btn-icon" onClick={() => setEditing(true)}>{Icons.edit()}</button>
          ) : (
            <button className="btn-icon accent" onClick={save} disabled={saving}>{Icons.save()}</button>
          )}
          <button className="btn-icon danger" onClick={remove}>{Icons.trash()}</button>
        </div>
      </div>

      <div className="detail-content">
        {editing ? (
          <>
            <input className="detail-title-edit" value={title}
              onChange={(e) => setTitle(e.target.value)} placeholder="Títol" />

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Categoria</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sense categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <textarea ref={taRef} className="detail-text-edit" value={content}
              onChange={(e) => {
                setContent(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Escriu o edita la transcripció..." />
          </>
        ) : (
          <>
            <h1 className="detail-title">{note.title}</h1>
            <div className="detail-meta">
              {note.category && (
                <span className="category-badge"
                  style={{ background: note.category.color || 'var(--accent)' }}>
                  {note.category.name}
                </span>
              )}
              {!note.category && (
                <span className="category-badge" style={{ background: 'var(--text-3)' }}>
                  Sense categoria
                </span>
              )}
              <span className="detail-date">{formatDate(note.updated_at)}</span>
              <span className="detail-lang">{note.language?.toUpperCase()}</span>
              {note.is_pinned && <span className="pinned-badge">📌</span>}
            </div>
            <div className="detail-text">
              {note.content || (
                <span className="text-muted">Nota buida — edita per afegir text</span>
              )}
            </div>
          </>
        )}

        {note.recordings?.length > 0 && (
          <div className="recordings-section">
            <h3>Gravacions</h3>
            {note.recordings.map((r) => (
              <div key={r.id} className="recording-card">
                <div className="recording-card-header">
                  <span>{formatTime(Math.floor(r.duration_seconds || 0))}</span>
                  {r.confidence && (
                    <span className="confidence-badge">
                      {Math.round(r.confidence * 100)}%
                    </span>
                  )}
                </div>
                {r.file_path && <AudioPlayer src={`/${r.file_path}`} />}
                {r.transcription && (
                  <p className="recording-transcription">{r.transcription}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
