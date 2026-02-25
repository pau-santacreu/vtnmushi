const I = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const Icons = {
  mic: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  stop: (p) => <I {...p} d="M6 6h12v12H6z" />,
  upload: (p) => <I {...p} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  plus: (p) => <I {...p} d="M12 5v14M5 12h14" />,
  search: (p) => <I {...p} d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />,
  edit: (p) => <I {...p} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />,
  trash: (p) => <I {...p} d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  sun: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (p) => <I {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  logout: (p) => <I {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  back: (p) => <I {...p} d="M19 12H5M12 19l-7-7 7-7" />,
  save: (p) => <I {...p} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />,
  play: (p) => <I {...p} d="M5 3l14 9-14 9V3z" />,
  pause: (p) => <I {...p} d="M6 4h4v16H6zM14 4h4v16h-4z" />,
  pin: (p) => <I {...p} d="M12 2L12 22M5 12h14" />,
  wave: (p) => <I {...p} d="M2 12h2m2-4h2v8H6zm4-6h2v16h-2zm4-1h2v18h-2zm4 5h2v8h-2zm4 2h2v4h-2z" />,
  x: (p) => <I {...p} d="M18 6L6 18M6 6l12 12" />,
}

export default Icons
