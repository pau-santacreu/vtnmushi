export const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
