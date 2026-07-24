import type { AnalysisResult, AnalyzerMemory, ExerciseId, Landmark, RepCounterConfig } from '../types'
import { createRepCounterState, updateRepCounter } from './repCounter'

const LEFT = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 }
const RIGHT = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 }

const PUSH_UP_COUNTER: RepCounterConfig = {
  topEnter: 158,
  topExit: 145,
  bottomEnter: 105,
  bottomExit: 120,
  topStableFrames: 10,
  bottomStableFrames: 5,
  returnStableFrames: 8,
  minRange: 48,
  minRepDurationMs: 650,
  maxRepDurationMs: 9000,
  cooldownMs: 500,
  maxFrameJump: 28,
  invalidResetFrames: 3,
  smoothing: 0.72
}

const SQUAT_COUNTER: RepCounterConfig = {
  topEnter: 160,
  topExit: 148,
  bottomEnter: 108,
  bottomExit: 122,
  topStableFrames: 10,
  bottomStableFrames: 5,
  returnStableFrames: 8,
  minRange: 48,
  minRepDurationMs: 700,
  maxRepDurationMs: 10000,
  cooldownMs: 550,
  maxFrameJump: 28,
  invalidResetFrames: 3,
  smoothing: 0.72
}

type SidePoints = {
  shoulder: Landmark
  elbow: Landmark
  wrist: Landmark
  hip: Landmark
  knee: Landmark
  ankle: Landmark
}

export function createAnalyzerMemory(): AnalyzerMemory {
  return {
    phase: 'ready',
    reps: 0,
    holdStartedAt: null,
    holdSeconds: 0,
    lastCue: '',
    repCounter: createRepCounterState()
  }
}

function visible(point: Landmark | undefined) {
  return point?.visibility ?? point?.presence ?? 1
}

function getSide(landmarks: Landmark[]): SidePoints | null {
  if (landmarks.length < 29) return null
  const leftScore = Object.values(LEFT).reduce((sum, index) => sum + visible(landmarks[index]), 0)
  const rightScore = Object.values(RIGHT).reduce((sum, index) => sum + visible(landmarks[index]), 0)
  const side = leftScore >= rightScore ? LEFT : RIGHT
  return {
    shoulder: landmarks[side.shoulder],
    elbow: landmarks[side.elbow],
    wrist: landmarks[side.wrist],
    hip: landmarks[side.hip],
    knee: landmarks[side.knee],
    ankle: landmarks[side.ankle]
  }
}

function radiansToDegrees(value: number) {
  return value * (180 / Math.PI)
}

function angle(a: Landmark, b: Landmark, c: Landmark) {
  const ba = { x: a.x - b.x, y: a.y - b.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  const denominator = Math.hypot(ba.x, ba.y) * Math.hypot(bc.x, bc.y)
  if (denominator === 0) return 0
  const cosine = Math.max(-1, Math.min(1, (ba.x * bc.x + ba.y * bc.y) / denominator))
  return radiansToDegrees(Math.acos(cosine))
}

function horizontalAngle(a: Landmark, b: Landmark) {
  const raw = Math.abs(radiansToDegrees(Math.atan2(b.y - a.y, b.x - a.x)))
  return Math.abs(raw > 90 ? 180 - raw : raw)
}

function verticalDeviation(a: Landmark, b: Landmark) {
  return Math.abs(90 - horizontalAngle(a, b))
}

function torsoLean(shoulder: Landmark, hip: Landmark) {
  const dx = Math.abs(shoulder.x - hip.x)
  const dy = Math.abs(shoulder.y - hip.y)
  return radiansToDegrees(Math.atan2(dx, Math.max(dy, 0.0001)))
}

function hipOffsetFromBodyLine(shoulder: Landmark, hip: Landmark, ankle: Landmark) {
  const run = ankle.x - shoulder.x
  if (Math.abs(run) < 0.04) return 0
  const t = (hip.x - shoulder.x) / run
  const expectedY = shoulder.y + (ankle.y - shoulder.y) * t
  return hip.y - expectedY
}

function keyVisibility(points: SidePoints) {
  return Object.values(points).reduce((sum, point) => sum + visible(point), 0) / 6
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function updateHold(memory: AnalyzerMemory, good: boolean, now: number) {
  if (good) {
    const started = memory.holdStartedAt ?? now
    return {
      ...memory,
      phase: 'holding' as const,
      holdStartedAt: started,
      holdSeconds: (now - started) / 1000
    }
  }
  return { ...memory, phase: 'ready' as const, holdStartedAt: null, holdSeconds: 0 }
}

function noPose(memory: AnalyzerMemory, message = 'Make sure your shoulders, hips, knees, and ankles are visible.'): AnalysisResult {
  return {
    score: 0,
    headline: 'Step fully into frame',
    cue: message,
    positives: [],
    metrics: [
      { label: 'Body visibility', value: 'Low', good: false },
      { label: 'Counter', value: 'Paused', good: false }
    ],
    memory: { ...memory, holdStartedAt: null, holdSeconds: 0 }
  }
}

export function analyzeForm(
  exercise: ExerciseId,
  landmarks: Landmark[],
  memory: AnalyzerMemory,
  now = performance.now()
): AnalysisResult {
  const points = getSide(landmarks)
  if (!points || keyVisibility(points) < 0.68) {
    if (exercise === 'push-up' || exercise === 'squat') {
      const config = exercise === 'push-up' ? PUSH_UP_COUNTER : SQUAT_COUNTER
      const repUpdate = updateRepCounter(memory.repCounter, Number.NaN, now, false, config)
      return noPose({ ...memory, reps: repUpdate.state.reps, repCounter: repUpdate.state })
    }
    return noPose(memory)
  }

  switch (exercise) {
    case 'push-up':
      return analyzePushUp(points, memory, now)
    case 'squat':
      return analyzeSquat(points, memory, now)
    case 'plank':
      return analyzePlank(points, memory, now)
    case 'handstand':
      return analyzeHandstand(points, memory, now)
    case 'front-lever':
      return analyzeFrontLever(points, memory, now)
  }
}

function analyzePushUp(points: SidePoints, memory: AnalyzerMemory, now: number): AnalysisResult {
  const elbow = angle(points.shoulder, points.elbow, points.wrist)
  const body = angle(points.shoulder, points.hip, points.ankle)
  const bodyFromHorizontal = horizontalAngle(points.shoulder, points.ankle)
  const hipOffset = hipOffsetFromBodyLine(points.shoulder, points.hip, points.ankle)
  const wristNearShoulder = Math.abs(points.wrist.x - points.shoulder.x) < 0.28
  const validPushUpPose = bodyFromHorizontal <= 38 && body >= 145 && wristNearShoulder
  const repUpdate = updateRepCounter(memory.repCounter, elbow, now, validPushUpPose, PUSH_UP_COUNTER)
  const next = { ...memory, reps: repUpdate.state.reps, repCounter: repUpdate.state }

  let score = 100
  if (!validPushUpPose) score -= 35
  if (body < 160) score -= (160 - body) * 1.7
  if (Math.abs(hipOffset) > 0.035) score -= Math.min(28, Math.abs(hipOffset) * 420)

  let formCue = 'Good line—keep the whole body moving together.'
  if (!validPushUpPose) formCue = 'Use a clear side view and get into a horizontal push-up position.'
  else if (hipOffset > 0.045) formCue = 'Lift your hips slightly; your midsection is sagging.'
  else if (hipOffset < -0.045) formCue = 'Lower your hips slightly; avoid piking.'
  else if (repUpdate.state.phase === 'descending' && elbow > 112) formCue = 'Keep lowering until your elbows reach about 90 degrees.'
  else if (repUpdate.state.phase === 'ascending' && elbow < 150) formCue = 'Finish with full elbow lockout.'

  const counterNeedsAttention = repUpdate.status.includes('camera') || repUpdate.status.includes('Hold') || repUpdate.status.includes('ignored') || repUpdate.status.includes('Tracking')
  return {
    score: clampScore(score),
    headline: repUpdate.counted
      ? `Rep ${next.reps} confirmed`
      : next.repCounter.phase === 'waiting'
        ? 'Hold the top position to begin'
        : `${next.reps} verified rep${next.reps === 1 ? '' : 's'}`,
    cue: counterNeedsAttention ? repUpdate.status : formCue,
    positives: [body >= 165 ? 'Strong body line' : '', elbow < 105 ? 'Good bottom depth' : '', elbow > 160 ? 'Full lockout' : ''].filter(Boolean),
    metrics: [
      { label: 'Counter state', value: counterLabel(next.repCounter.phase), good: next.repCounter.phase !== 'waiting' },
      { label: 'Elbow angle', value: `${Math.round(elbow)}°`, good: elbow < 105 || elbow > 155 },
      { label: 'Body line', value: `${Math.round(body)}°`, good: body >= 160 },
      { label: 'Camera angle', value: `${Math.round(bodyFromHorizontal)}°`, good: bodyFromHorizontal <= 38 }
    ],
    memory: next
  }
}

function analyzeSquat(points: SidePoints, memory: AnalyzerMemory, now: number): AnalysisResult {
  const knee = angle(points.hip, points.knee, points.ankle)
  const hip = angle(points.shoulder, points.hip, points.knee)
  const lean = torsoLean(points.shoulder, points.hip)
  const bodyFromHorizontal = horizontalAngle(points.shoulder, points.ankle)
  const bodyHeight = Math.abs(points.ankle.y - points.shoulder.y)
  const validSquatPose = bodyFromHorizontal >= 42 && bodyHeight >= 0.32 && points.hip.y < points.ankle.y
  const repUpdate = updateRepCounter(memory.repCounter, knee, now, validSquatPose, SQUAT_COUNTER)
  const next = { ...memory, reps: repUpdate.state.reps, repCounter: repUpdate.state }

  let score = 100
  if (!validSquatPose) score -= 35
  if (lean > 48) score -= Math.min(30, (lean - 48) * 1.8)

  let formCue = 'Keep your whole foot planted and control the tempo.'
  if (!validSquatPose) formCue = 'Stand fully in frame from a clear side view before beginning.'
  else if (lean > 52) formCue = 'Keep your chest a little taller as you descend.'
  else if (repUpdate.state.phase === 'descending' && knee > 118) formCue = 'Continue to a consistent, comfortable depth.'
  else if (repUpdate.state.phase === 'ascending' && knee < 150) formCue = 'Stand fully tall and hold before the next rep.'

  const counterNeedsAttention = repUpdate.status.includes('camera') || repUpdate.status.includes('Hold') || repUpdate.status.includes('ignored') || repUpdate.status.includes('Tracking')
  return {
    score: clampScore(score),
    headline: repUpdate.counted
      ? `Rep ${next.reps} confirmed`
      : next.repCounter.phase === 'waiting'
        ? 'Stand tall and hold to begin'
        : `${next.reps} verified rep${next.reps === 1 ? '' : 's'}`,
    cue: counterNeedsAttention ? repUpdate.status : formCue,
    positives: [knee < 108 ? 'Consistent squat depth' : '', lean <= 45 ? 'Controlled torso position' : '', knee > 160 ? 'Full standing finish' : ''].filter(Boolean),
    metrics: [
      { label: 'Counter state', value: counterLabel(next.repCounter.phase), good: next.repCounter.phase !== 'waiting' },
      { label: 'Knee angle', value: `${Math.round(knee)}°`, good: knee < 110 || knee > 155 },
      { label: 'Torso lean', value: `${Math.round(lean)}°`, good: lean <= 48 },
      { label: 'Hip angle', value: `${Math.round(hip)}°`, good: hip < 115 || hip > 155 }
    ],
    memory: next
  }
}

function counterLabel(phase: AnalyzerMemory['repCounter']['phase']) {
  switch (phase) {
    case 'waiting': return 'Waiting for start'
    case 'ready': return 'Armed'
    case 'descending': return 'Moving down'
    case 'bottom': return 'Bottom confirmed'
    case 'ascending': return 'Returning to start'
  }
}

function analyzePlank(points: SidePoints, memory: AnalyzerMemory, now: number): AnalysisResult {
  const body = angle(points.shoulder, points.hip, points.ankle)
  const hipOffset = hipOffsetFromBodyLine(points.shoulder, points.hip, points.ankle)
  const good = body >= 160 && Math.abs(hipOffset) < 0.045
  const next = updateHold(memory, good, now)

  let cue = 'Hold this line and keep breathing.'
  if (hipOffset > 0.045) cue = 'Raise your hips slightly to remove the sag.'
  else if (hipOffset < -0.045) cue = 'Lower your hips slightly to make one straight line.'
  else if (body < 160) cue = 'Brace your trunk and straighten your body line.'

  return {
    score: clampScore(100 - Math.max(0, 165 - body) * 2 - Math.max(0, Math.abs(hipOffset) - 0.025) * 420),
    headline: good ? `Clean hold: ${next.holdSeconds.toFixed(1)}s` : 'Reset your body line',
    cue,
    positives: good ? ['Shoulders, hips, and ankles are aligned'] : [],
    metrics: [
      { label: 'Body line', value: `${Math.round(body)}°`, good: body >= 160 },
      { label: 'Hip position', value: Math.abs(hipOffset) < 0.04 ? 'Aligned' : hipOffset > 0 ? 'Low' : 'High', good: Math.abs(hipOffset) < 0.04 },
      { label: 'Current hold', value: `${next.holdSeconds.toFixed(1)}s`, good }
    ],
    memory: next
  }
}

function analyzeHandstand(points: SidePoints, memory: AnalyzerMemory, now: number): AnalysisResult {
  const elbow = angle(points.shoulder, points.elbow, points.wrist)
  const shoulder = angle(points.wrist, points.shoulder, points.hip)
  const body = angle(points.shoulder, points.hip, points.ankle)
  const vertical = verticalDeviation(points.wrist, points.ankle)
  const good = elbow >= 158 && shoulder >= 150 && body >= 158 && vertical <= 16
  const next = updateHold(memory, good, now)

  let cue = 'Stay tall through your shoulders and use your fingertips for balance.'
  if (elbow < 158) cue = 'Straighten your elbows and push the floor away.'
  else if (shoulder < 150) cue = 'Open your shoulders so your hips can stack over your hands.'
  else if (body < 158) cue = 'Bring your ribs in and squeeze your glutes to reduce the arch.'
  else if (vertical > 16) cue = 'Move your hips back over your hands to find the stack.'

  return {
    score: clampScore(100 - Math.max(0, 165 - elbow) * 1.4 - Math.max(0, 160 - shoulder) * 1.2 - Math.max(0, 165 - body) * 1.2 - Math.max(0, vertical - 8) * 1.5),
    headline: good ? `Stacked hold: ${next.holdSeconds.toFixed(1)}s` : 'Find a straighter stack',
    cue,
    positives: [elbow >= 165 ? 'Elbows locked' : '', shoulder >= 160 ? 'Shoulders open' : '', body >= 165 ? 'Strong body line' : ''].filter(Boolean),
    metrics: [
      { label: 'Elbow lockout', value: `${Math.round(elbow)}°`, good: elbow >= 158 },
      { label: 'Shoulder angle', value: `${Math.round(shoulder)}°`, good: shoulder >= 150 },
      { label: 'Body line', value: `${Math.round(body)}°`, good: body >= 158 },
      { label: 'Vertical deviation', value: `${Math.round(vertical)}°`, good: vertical <= 16 }
    ],
    memory: next
  }
}

function analyzeFrontLever(points: SidePoints, memory: AnalyzerMemory, now: number): AnalysisResult {
  const elbow = angle(points.shoulder, points.elbow, points.wrist)
  const body = angle(points.shoulder, points.hip, points.ankle)
  const horizontal = horizontalAngle(points.shoulder, points.ankle)
  const hipOffset = hipOffsetFromBodyLine(points.shoulder, points.hip, points.ankle)
  const good = elbow >= 158 && body >= 158 && horizontal <= 16 && Math.abs(hipOffset) < 0.05
  const next = updateHold(memory, good, now)

  let cue = 'Pull the bar toward your hips and keep your body rigid.'
  if (elbow < 158) cue = 'Straighten your elbows before extending the progression.'
  else if (horizontal > 16) cue = 'Raise your hips until your body is closer to horizontal.'
  else if (body < 158 || hipOffset > 0.05) cue = 'Use a stronger hollow position and bring your hips up.'

  return {
    score: clampScore(100 - Math.max(0, 165 - elbow) * 1.5 - Math.max(0, 165 - body) * 1.4 - Math.max(0, horizontal - 8) * 1.8 - Math.max(0, Math.abs(hipOffset) - 0.03) * 350),
    headline: good ? `Clean lever hold: ${next.holdSeconds.toFixed(1)}s` : 'Adjust the lever line',
    cue,
    positives: [elbow >= 165 ? 'Straight arms' : '', body >= 165 ? 'Rigid body line' : '', horizontal <= 10 ? 'Nearly horizontal' : ''].filter(Boolean),
    metrics: [
      { label: 'Elbow lockout', value: `${Math.round(elbow)}°`, good: elbow >= 158 },
      { label: 'Body line', value: `${Math.round(body)}°`, good: body >= 158 },
      { label: 'From horizontal', value: `${Math.round(horizontal)}°`, good: horizontal <= 16 },
      { label: 'Current hold', value: `${next.holdSeconds.toFixed(1)}s`, good }
    ],
    memory: next
  }
}
