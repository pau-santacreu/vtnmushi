import { useState, useRef } from 'react'
import Icons from './Icons'
import { formatTime } from '../utils'

export default function AudioPlayer({ src }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)

  return (
    <div className="audio-player">
      <audio
        ref={ref}
        src={src}
        onTimeUpdate={() => {
          setCur(ref.current.currentTime)
          setProgress((ref.current.currentTime / ref.current.duration) * 100)
        }}
        onLoadedMetadata={() => setDur(ref.current.duration)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
      />
      <button className="btn-icon" onClick={() => {
        playing ? ref.current.pause() : ref.current.play()
        setPlaying(!playing)
      }}>
        {playing ? Icons.pause({ size: 16 }) : Icons.play({ size: 16 })}
      </button>
      <div className="progress-bar" onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        ref.current.currentTime = ((e.clientX - r.left) / r.width) * ref.current.duration
      }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <span className="audio-time">
        {formatTime(Math.floor(cur))} / {formatTime(Math.floor(dur))}
      </span>
    </div>
  )
}
