import { useState, useRef, useCallback } from 'react'

export default function useAudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [levels, setLevels] = useState(new Array(32).fill(0))

  const mediaRecorder = useRef(null)
  const analyser = useRef(null)
  const animFrame = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const startTime = useRef(null)

  const updateLevels = useCallback(() => {
    if (!analyser.current) return
    const data = new Uint8Array(analyser.current.frequencyBinCount)
    analyser.current.getByteFrequencyData(data)
    const step = Math.floor(data.length / 32)
    const nl = []
    for (let i = 0; i < 32; i++) nl.push(data[i * step] / 255)
    setLevels(nl)
    animFrame.current = requestAnimationFrame(updateLevels)
  }, [])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      analyser.current = ctx.createAnalyser()
      analyser.current.fftSize = 128
      source.connect(analyser.current)

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      chunks.current = []
      mr.ondataavailable = (e) => chunks.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      mediaRecorder.current = mr
      setRecording(true)
      setAudioBlob(null)
      setAudioUrl(null)
      startTime.current = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime.current) / 1000))
      }, 200)
      updateLevels()
    } catch {
      alert("No s'ha pogut accedir al micròfon. Revisa els permisos.")
    }
  }, [updateLevels])

  const stop = useCallback(() => {
    mediaRecorder.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
    cancelAnimationFrame(animFrame.current)
    setLevels(new Array(32).fill(0))
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setLevels(new Array(32).fill(0))
  }, [])

  return { recording, duration, audioBlob, audioUrl, levels, start, stop, reset }
}
