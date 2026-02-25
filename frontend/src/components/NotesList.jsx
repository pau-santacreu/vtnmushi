import Icons from './Icons'
import { formatDate } from '../utils'

export default function NotesList({ notes, onSelect, searchTerm }) {
  if (!notes.length) {
    return (
      <div className="empty-state">
        {Icons.wave({ size: 48 })}
        <p>{searchTerm ? 'Cap nota trobada' : 'Encara no tens notes'}</p>
        <p className="text-muted">
          {searchTerm ? 'Prova amb un altre terme' : 'Crea la teva primera nota de veu!'}
        </p>
      </div>
    )
  }

  return (
    <div className="notes-grid">
      {notes.map((n) => (
        <div key={n.id} className="note-card" onClick={() => onSelect(n)}>
          <div className="note-card-header">
            <h3>{n.title}</h3>
            {n.is_pinned && <span className="pin-icon">📌</span>}
          </div>
          <p className="note-card-preview">
            {n.content
              ? n.content.substring(0, 120) + (n.content.length > 120 ? '...' : '')
              : 'Nota buida'}
          </p>
          <div className="note-card-footer">
            {n.category && (
              <span className="category-dot"
                style={{ background: n.category.color || 'var(--accent)' }} />
            )}
            <span className="note-card-date">{formatDate(n.updated_at)}</span>
            <span className="note-card-lang">{n.language?.toUpperCase()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
