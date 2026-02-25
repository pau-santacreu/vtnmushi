export default function Waveform({ levels, active }) {
  return (
    <div className={`waveform ${active ? 'active' : ''}`}>
      {levels.map((l, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            height: `${Math.max(4, l * 48)}px`,
            opacity: active ? 0.6 + l * 0.4 : 0.3,
            animationDelay: `${i * 30}ms`,
          }}
        />
      ))}
    </div>
  )
}
