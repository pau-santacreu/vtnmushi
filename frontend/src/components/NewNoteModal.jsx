import { useState, useRef } from 'react'
import api from '../api'
import Icons from './Icons'
import AudioPlayer from './AudioPlayer'
import Waveform from './Waveform'
import useAudioRecorder from '../hooks/useAudioRecorder'
import { formatTime } from '../utils'

export default function NewNoteModal({ onClose, onCreated, categories }) {
  const rec = useAudioRecorder()
  const [title, setTitle] = useState('')
  const [catId, setCatId] = useState('')
  const [lang, setLang] = useState('ca')
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const submit = async () => {
    if (!title.trim()) { setError('Escriu un títol'); return }
    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('language', lang)
      if (catId) fd.append('category_id', catId)
      if (rec.audioBlob) fd.append('audio_file', rec.audioBlob, 'recording.webm')
      else if (file) fd.append('audio_file', file)
      const note = await api.upload('/notes', fd)
      onCreated(note)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova nota</h2>
          <button className="btn-icon" onClick={onClose}>{Icons.x()}</button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label>Títol</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="De què va aquesta nota?" autoFocus />
          </div>

          <div className="input-row">
            <div className="input-group" style={{ flex: 1 }}>
              <label>Idioma</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="ca">Català</option>
                <option value="es">Castellà</option>
                <option value="en">Anglès</option>
                <option value="fr">Francès</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Categoria</label>
              <select value={catId} onChange={(e) => setCatId(e.target.value)}>
                <option value="">Cap</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audio source selection */}
          {!mode && !rec.audioBlob && !file && (
            <div className="audio-source-buttons">
              <button className="btn-audio-source" onClick={() => { setMode('rec'); rec.start() }}>
                {Icons.mic({ size: 28 })}
                <span>Gravar</span>
                <span className="btn-audio-hint">Des del micròfon</span>
              </button>
              <button className="btn-audio-source" onClick={() => { setMode('up'); fileRef.current?.click() }}>
                {Icons.upload({ size: 28 })}
                <span>Pujar fitxer</span>
                <span className="btn-audio-hint">MP3, WAV, OGG, WEBM</span>
              </button>
              <input ref={fileRef} type="file" accept="audio/*" hidden
                onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]) }} />
            </div>
          )}

          {/* Recording */}
          {mode === 'rec' && rec.recording && (
            <div className="recording-state">
              <Waveform levels={rec.levels} active={true} />
              <div className="recording-info">
                <span className="recording-dot" />
                <span className="recording-time">{formatTime(rec.duration)}</span>
              </div>
              <button className="btn-stop" onClick={rec.stop}>
                {Icons.stop({ size: 24 })}<span>Aturar</span>
              </button>
            </div>
          )}

          {/* Recorded preview */}
          {rec.audioUrl && !rec.recording && (
            <div className="audio-preview">
              <div className="audio-preview-header">
                <span>Gravació ({formatTime(rec.duration)})</span>
                <button className="btn-icon btn-sm" onClick={() => { rec.reset(); setMode(null) }}>
                  {Icons.x({ size: 16 })}
                </button>
              </div>
              <AudioPlayer src={rec.audioUrl} />
            </div>
          )}

          {/* File upload preview */}
          {file && (
            <div className="audio-preview">
              <div className="audio-preview-header">
                <span>{file.name}</span>
                <button className="btn-icon btn-sm" onClick={() => { setFile(null); setMode(null) }}>
                  {Icons.x({ size: 16 })}
                </button>
              </div>
              <AudioPlayer src={URL.createObjectURL(file)} />
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel·lar</button>
          <button className="btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Transcrivint...' : 'Crear nota'}
          </button>
        </div>
      </div>
    </div>
  )
}
