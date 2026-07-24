import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CheckCircle2, FileVideo, Play, RefreshCw, Square, Upload, Video } from 'lucide-react'
import { exercises } from '../data/exercises'
import { analyzeForm, createAnalyzerMemory } from '../lib/formRules'
import { clearPose, drawPose, getPoseLandmarker } from '../lib/pose'
import type { AnalysisResult, ExerciseId } from '../types'

type SourceMode = 'camera' | 'recording'

type Props = {
  initialExercise: ExerciseId
}

export function FormCheck({ initialExercise }: Props) {
  const [exerciseId, setExerciseId] = useState<ExerciseId>(initialExercise)
  const [sourceMode, setSourceMode] = useState<SourceMode>('camera')
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoName, setVideoName] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const memoryRef = useRef(createAnalyzerMemory())
  const lastVideoTimeRef = useRef(-1)
  const selectedExercise = useMemo(() => exercises.find((exercise) => exercise.id === exerciseId) ?? exercises[0], [exerciseId])

  useEffect(() => {
    memoryRef.current = createAnalyzerMemory()
    setResult(null)
  }, [exerciseId])

  useEffect(() => () => stopAll(), [])

  async function startCamera() {
    stopAll()
    setError('')
    setLoading(true)
    setSourceMode('camera')
    try {
      await getPoseLandmarker()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      })
      streamRef.current = stream
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      videoRef.current.muted = true
      await videoRef.current.play()
      resetAnalysis()
      setRunning(true)
      runAnalysisLoop()
    } catch (cause) {
      setError(cameraError(cause))
      stopAll()
    } finally {
      setLoading(false)
    }
  }

  async function loadRecording(file: File | undefined) {
    if (!file || !videoRef.current) return
    stopAll()
    setError('')
    setLoading(true)
    setSourceMode('recording')
    setVideoName(file.name)
    try {
      await getPoseLandmarker()
      const url = URL.createObjectURL(file)
      objectUrlRef.current = url
      videoRef.current.srcObject = null
      videoRef.current.src = url
      videoRef.current.muted = true
      videoRef.current.controls = true
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!
        video.onloadeddata = () => resolve()
        video.onerror = () => reject(new Error('The selected video could not be opened.'))
      })
      resetAnalysis()
      setRunning(true)
      await videoRef.current.play()
      runAnalysisLoop()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not analyze this recording.')
      stopAll()
    } finally {
      setLoading(false)
    }
  }

  function runAnalysisLoop() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    const tick = async () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        frameRef.current = requestAnimationFrame(tick)
        return
      }

      if (!video.paused && video.currentTime !== lastVideoTimeRef.current) {
        try {
          const landmarker = await getPoseLandmarker()
          const detection = landmarker.detectForVideo(video, performance.now())
          const landmarks = detection.landmarks[0]
          if (landmarks?.length) {
            drawPose(canvas, landmarks, video.videoWidth, video.videoHeight)
            const analysis = analyzeForm(exerciseId, landmarks, memoryRef.current)
            memoryRef.current = analysis.memory
            setResult(analysis)
          } else {
            clearPose(canvas)
          }
          lastVideoTimeRef.current = video.currentTime
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Pose analysis stopped unexpectedly.')
        }
      }

      if (sourceMode === 'recording' && video.ended) {
        setRunning(false)
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  function resetAnalysis() {
    memoryRef.current = createAnalyzerMemory()
    lastVideoTimeRef.current = -1
    setResult(null)
  }

  function stopAll() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.controls = sourceMode === 'recording'
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    clearPose(canvasRef.current)
    setRunning(false)
  }

  function switchMode(mode: SourceMode) {
    stopAll()
    setSourceMode(mode)
    setError('')
    setVideoName('')
    resetAnalysis()
  }

  return (
    <section className="workspace form-workspace">
      <header className="workspace-header form-header">
        <div>
          <span className="eyebrow">Offline camera coach</span>
          <h1>Check your form</h1>
          <p>Select the movement first so every angle and coaching cue is specific to that exercise.</p>
        </div>
        <label className="exercise-select">
          <span>Exercise</span>
          <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value as ExerciseId)}>
            {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
          </select>
        </label>
      </header>

      <div className="form-grid">
        <div className="camera-panel panel">
          <div className="source-tabs" role="tablist" aria-label="Video source">
            <button className={sourceMode === 'camera' ? 'active' : ''} onClick={() => switchMode('camera')}>
              <Camera size={18} /> Laptop camera
            </button>
            <button className={sourceMode === 'recording' ? 'active' : ''} onClick={() => switchMode('recording')}>
              <FileVideo size={18} /> Phone or recorded video
            </button>
          </div>

          <div className="video-stage">
            <video ref={videoRef} playsInline className="analysis-video" />
            <canvas ref={canvasRef} className="pose-overlay" />
            {!running && !loading ? (
              <div className="video-placeholder">
                {sourceMode === 'camera' ? <Camera size={54} /> : <Upload size={54} />}
                <strong>{sourceMode === 'camera' ? 'Laptop camera is off' : 'Choose a video recorded on your phone'}</strong>
                <span>{sourceMode === 'camera' ? 'Nothing is uploaded. Pose analysis stays on this computer.' : 'Transfer the clip to your laptop, then select it here. The clip remains local.'}</span>
              </div>
            ) : null}
            {loading ? <div className="loading-cover"><RefreshCw className="spin" /> Loading offline pose model…</div> : null}
          </div>

          <div className="camera-actions">
            {sourceMode === 'camera' ? (
              running ? (
                <button className="danger-button" onClick={stopAll}><Square size={17} /> Stop camera</button>
              ) : (
                <button className="primary-button" onClick={startCamera} disabled={loading}><Play size={17} /> Start camera</button>
              )
            ) : (
              <label className="primary-button file-button">
                <Video size={17} /> {videoName ? 'Choose another video' : 'Choose video'}
                <input type="file" accept="video/*" onChange={(event) => loadRecording(event.target.files?.[0])} />
              </label>
            )}
            <button className="secondary-button" onClick={resetAnalysis} disabled={!running}><RefreshCw size={17} /> Reset count</button>
          </div>
          {error ? <div className="error-banner">{error}</div> : null}
        </div>

        <aside className="analysis-panel panel">
          <div className="analysis-heading">
            <div>
              <span className="eyebrow">{selectedExercise.cameraAngle}</span>
              <h2>{selectedExercise.name}</h2>
            </div>
            <div className={`score-ring ${result && result.score >= 75 ? 'score-ring--good' : ''}`}>
              <strong>{result ? result.score : '—'}</strong>
              <span>form</span>
            </div>
          </div>

          {result ? (
            <>
              <div className="main-cue">
                <strong>{result.headline}</strong>
                <p>{result.cue}</p>
              </div>
              {result.positives.length ? (
                <div className="positive-list">
                  {result.positives.map((positive) => <span key={positive}><CheckCircle2 size={16} /> {positive}</span>)}
                </div>
              ) : null}
              <div className="metric-grid">
                {result.metrics.map((metric) => (
                  <div className={metric.good ? 'metric is-good' : 'metric'} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="waiting-analysis">
              <Video size={40} />
              <strong>Start a camera or video</strong>
              <p>Live measurements and the most important correction will appear here.</p>
            </div>
          )}

          <div className="setup-card">
            <h3>Camera setup</h3>
            <ol>
              {selectedExercise.setup.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
          <div className="tracked-card">
            <h3>What this checker tracks</h3>
            <div>{selectedExercise.tracked.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <p className="safety-note">Formcheck is a technique aid, not medical advice. Stop movements that cause pain and use safe progressions and equipment.</p>
        </aside>
      </div>
    </section>
  )
}

function cameraError(cause: unknown) {
  if (cause instanceof DOMException) {
    if (cause.name === 'NotAllowedError') return 'Camera permission was denied. Allow camera access for Formcheck in Windows settings, then try again.'
    if (cause.name === 'NotFoundError') return 'No camera was found. Connect a webcam or use a recorded phone video.'
    if (cause.name === 'NotReadableError') return 'The camera is already being used by another app.'
  }
  return cause instanceof Error ? cause.message : 'The camera could not be started.'
}
