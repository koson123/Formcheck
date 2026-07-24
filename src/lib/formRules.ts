import type { AnalysisResult, AnalyzerMemory, ExerciseId, Landmark } from '../types'

const LEFT = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 }
const RIGHT = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 }

type SidePoints = {
  shoulder: Landmark
  elbow: Landmark
  wrist: Landmark
  hip: Landmark
  knee: Landmark
  ankle: Landmark
}

export function createAnalyzerMemory(): AnalyzerMemory {
  return { phase: 'ready', reps: 0, holdStartedAt: null, holdSeconds: 0, lastCue: '' }
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
  const normalized = raw > 90 ? 180 - raw : raw
  return Math.abs(normalized)
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

function noPose(memory: AnalyzerMemory): AnalysisResult {
  return {
    score: 0,
    headline: 'Step fully into frame',
    cue: 'Make sure your shoulders, hips, knees, and ankles are visible.',
    positives: [],
    metrics: [{ label: 'Body visibility', value: 'Low', good: false }],
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
  if (!points || keyVisibility(points) < 0.55) return noPose(memory)

  switch (exercise) {
    case 'push-up':
      return analyzePushUp(points, memory)
    case 'squat':
      return analyzeSquat(points, memory)
    case 'plank':
      return analyzePlank(points, memory, now)
    case 'handstand':
      return analyzeHandstand(points, memory, now)
    case 'front-lever':
      return analyzeFrontLever(points, memory, now)
  }
}

function analyzePushUp(points: SidePoints, memory: AnalyzerMemory): AnalysisResult {
  const elbow = angle(points.shoulder, points.elbow, points.wrist)
  const body = angle(points.shoulder, points.hip, points.ankle)
  const hipOffset = hipOffsetFromBodyLine(points.shoulder, points.hip, points.ankle)
  let next = { ...memory }

  if (elbow < 100) next.phase = 'lowered'
  if (next.phase === 'lowered' && elbow > 155) {
    next = { ...next, phase: 'ready', reps: next.reps + 1 }
  }

  let score = 100
  if (body < 160) score -= (160 - body) * 1.7
  if (Math.abs(hipOffset) > 0.035) score -= Math.min(28, Math.abs(hipOffset) * 420)
  if (elbow > 125 && next.phase === 'lowered') score -= 18

  let cue = 'Good line—keep the whole body moving together.'
  if (hipOffset > 0.045) cue = 'Lift your hips slightly; your midsection is sagging.'
  else if (hipOffset < -0.045) cue = 'Lower your hips slightly; avoid piking.'
  else if (elbow > 145 && next.phase === 'lowered') cue = 'Lower farther until your elbows reach about 90 degrees.'
  else if (elbow < 150 && next.phase === 'ready') cue = 'Finish the rep with full elbow lockout.'

  return {
    score: clampScore(score),
    headline: `${next.reps} clean rep${next.reps === 1 ? '' : 's'} counted`,
    cue,
    positives: [body >= 165 ? 'Strong body line' : '', elbow < 105 ? 'Good bottom depth' : '', elbow > 160 ? 'Full lockout' : ''].filter(Boolean),
    metrics: [
      { label: 'Elbow angle', value: `${Math.round(elbow)}°`, good: elbow < 105 || elbow > 155 },
      { label: 'Body line', value: `${Math.round(body)}°`, good: body >= 160 },
      { label: 'Hip position', value: Math.abs(hipOffset) < 0.04 ? 'Aligned' : hipOffset > 0 ? 'Low' : 'High', good: Math.abs(hipOffset) < 0.04 }
    ],
    memory: next
  }
}

function analyzeSquat(points: SidePoints, memory: AnalyzerMemory): AnalysisResult {
  const knee = angle(points.hip, points.knee, points.ankle)
  const hip = angle(points.shoulder, points.hip, points.knee)
  const lean = torsoLean(points.shoulder, points.hip)
  let next = { ...memory }

  if (knee < 105) next.phase = 'lowered'
  if (next.phase === 'lowered' && knee > 160) {
    next = { ...next, phase: 'ready', reps: next.reps + 1 }
  }

  let score = 100
  if (lean > 48) score -= Math.min(30, (lean - 48) * 1.8)
  if (next.phase === 'lowered' && knee > 115) score -= 20
  if (next.phase === 'ready' && knee < 150) score -= 12

  let cue = 'Keep your whole foot planted and control the tempo.'
  if (lean > 52) cue = 'Keep your chest a little taller as you descend.'
  else if (knee > 115 && next.phase === 'lowered') cue = 'Use a little more depth while staying comfortable.'
  else if (knee < 150 && next.phase === 'ready') cue = 'Stand fully tall before beginning the next rep.'

  return {
    score: clampScore(score),
    headline: `${next.reps} controlled rep${next.reps === 1 ? '' : 's'} counted`,
    cue,
    positives: [knee < 105 ? 'Consistent squat depth' : '', lean <= 45 ? 'Controlled torso position' : '', knee > 160 ? 'Full standing finish' : ''].filter(Boolean),
    metrics: [
      { label: 'Knee angle', value: `${Math.round(knee)}°`, good: knee < 110 || knee > 155 },
      { label: 'Torso lean', value: `${Math.round(lean)}°`, good: lean <= 48 },
      { label: 'Hip angle', value: `${Math.round(hip)}°`, good: hip < 115 || hip > 155 }
    ],
    memory: next
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
