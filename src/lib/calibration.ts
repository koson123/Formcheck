import type {
  CalibrationCheck,
  CalibrationPhase,
  CalibrationState,
  ExerciseId,
  Landmark,
  TrackedSide
} from '../types'

const LEFT = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 }
const RIGHT = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 }
const STABLE_FRAMES_REQUIRED = 12
const START_FRAMES_REQUIRED = 12
const INVALID_FRAMES_BEFORE_RECALIBRATION = 12

type SidePoints = {
  shoulder: Landmark
  elbow: Landmark
  wrist: Landmark
  hip: Landmark
  knee: Landmark
  ankle: Landmark
}

export function createCalibrationState(): CalibrationState {
  return {
    phase: 'finding',
    calibrated: false,
    trackingValid: false,
    recommendedSide: null,
    stableFrames: 0,
    startFrames: 0,
    invalidFrames: 0,
    lastCenter: null,
    lastScale: null,
    bodyScale: null,
    progress: 0,
    message: 'Step into view so Formcheck can find your full body.',
    checks: initialChecks()
  }
}

export function updateCalibration(
  exercise: ExerciseId,
  landmarks: Landmark[],
  current: CalibrationState
): CalibrationState {
  if (landmarks.length < 29) {
    return loseCurrentFrame(current, 'finding', 'Step fully into view so Formcheck can find your body.', initialChecks())
  }

  const left = readSide(landmarks, 'left')
  const right = readSide(landmarks, 'right')
  const leftQuality = sideVisibility(left)
  const rightQuality = sideVisibility(right)
  const recommendedSide: TrackedSide = leftQuality >= rightQuality ? 'left' : 'right'
  const points = recommendedSide === 'left' ? left : right
  const visibility = Math.max(leftQuality, rightQuality)
  const allRequiredVisible = Object.values(points).every((point) => visible(point) >= 0.55)
  const visibilityPassed = visibility >= 0.68 && allRequiredVisible

  const bodyScale = distance(points.shoulder, points.ankle)
  const bodyPoints = Object.values(points)
  const insideFrame = bodyPoints.every((point) => point.x >= 0.025 && point.x <= 0.975 && point.y >= 0.025 && point.y <= 0.975)
  const framingPassed = visibilityPassed && insideFrame && bodyScale >= 0.30 && bodyScale <= 0.92

  const shoulderWidth = distance(landmarks[LEFT.shoulder], landmarks[RIGHT.shoulder])
  const hipWidth = distance(landmarks[LEFT.hip], landmarks[RIGHT.hip])
  const sideRatio = Math.max(shoulderWidth, hipWidth) / Math.max(bodyScale, 0.001)
  const orientationPassed = framingPassed && sideRatio <= 0.30

  const center = averagePoint(points.shoulder, points.hip, points.ankle)
  const centerShift = current.lastCenter ? distance(center, current.lastCenter) : Number.POSITIVE_INFINITY
  const scaleShift = current.lastScale === null ? Number.POSITIVE_INFINITY : Math.abs(bodyScale - current.lastScale)
  const frameStable = orientationPassed && centerShift <= 0.022 && scaleShift <= 0.035
  const stableFrames = frameStable ? Math.min(current.stableFrames + 1, STABLE_FRAMES_REQUIRED) : 0
  const stabilityPassed = stableFrames >= STABLE_FRAMES_REQUIRED

  const startPosePassed = orientationPassed && isExerciseStartPose(exercise, points)
  const startFrames = stabilityPassed && startPosePassed
    ? Math.min(current.startFrames + 1, START_FRAMES_REQUIRED)
    : 0
  const startPassed = startFrames >= START_FRAMES_REQUIRED

  const checks = buildChecks(
    visibilityPassed,
    framingPassed,
    orientationPassed,
    stabilityPassed,
    startPassed,
    visibility,
    bodyScale,
    sideRatio,
    stableFrames,
    startFrames
  )

  const currentFrameValid = visibilityPassed && framingPassed && orientationPassed && startPosePassed

  if (current.calibrated) {
    if (currentFrameValid) {
      return {
        ...current,
        phase: 'ready',
        calibrated: true,
        trackingValid: true,
        recommendedSide,
        stableFrames: STABLE_FRAMES_REQUIRED,
        startFrames: START_FRAMES_REQUIRED,
        invalidFrames: 0,
        lastCenter: center,
        lastScale: bodyScale,
        bodyScale,
        progress: 100,
        message: 'Camera ready. Formcheck is now analyzing your movement.',
        checks: checks.map((check) => ({ ...check, passed: true }))
      }
    }

    const invalidFrames = current.invalidFrames + 1
    if (invalidFrames < INVALID_FRAMES_BEFORE_RECALIBRATION) {
      return {
        ...current,
        trackingValid: false,
        recommendedSide,
        invalidFrames,
        lastCenter: center,
        lastScale: bodyScale,
        bodyScale,
        message: pauseMessage(visibilityPassed, framingPassed, orientationPassed, startPosePassed),
        checks
      }
    }
  }

  const phase = determinePhase(visibilityPassed, framingPassed, orientationPassed, stabilityPassed, startPassed)
  const calibrated = startPassed

  return {
    phase: calibrated ? 'ready' : phase,
    calibrated,
    trackingValid: calibrated,
    recommendedSide,
    stableFrames,
    startFrames,
    invalidFrames: 0,
    lastCenter: center,
    lastScale: bodyScale,
    bodyScale,
    progress: calibrationProgress(visibilityPassed, framingPassed, orientationPassed, stableFrames, startFrames),
    message: calibrated
      ? 'Calibration complete. Formcheck is ready to analyze.'
      : phaseMessage(phase, exercise, bodyScale, insideFrame),
    checks
  }
}

function loseCurrentFrame(
  current: CalibrationState,
  phase: CalibrationPhase,
  message: string,
  checks: CalibrationCheck[]
): CalibrationState {
  if (current.calibrated && current.invalidFrames + 1 < INVALID_FRAMES_BEFORE_RECALIBRATION) {
    return {
      ...current,
      trackingValid: false,
      invalidFrames: current.invalidFrames + 1,
      message: 'Tracking paused. Move fully back into the camera view.',
      checks
    }
  }

  return {
    ...createCalibrationState(),
    phase,
    message,
    checks
  }
}

function readSide(landmarks: Landmark[], side: TrackedSide): SidePoints {
  const indices = side === 'left' ? LEFT : RIGHT
  return {
    shoulder: landmarks[indices.shoulder],
    elbow: landmarks[indices.elbow],
    wrist: landmarks[indices.wrist],
    hip: landmarks[indices.hip],
    knee: landmarks[indices.knee],
    ankle: landmarks[indices.ankle]
  }
}

function sideVisibility(points: SidePoints) {
  return Object.values(points).reduce((total, point) => total + visible(point), 0) / 6
}

function visible(point: Landmark | undefined) {
  return point?.visibility ?? point?.presence ?? 0
}

function distance(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function averagePoint(...points: Landmark[]): Landmark {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  }
}

function angle(a: Landmark, b: Landmark, c: Landmark) {
  const ba = { x: a.x - b.x, y: a.y - b.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  const denominator = Math.hypot(ba.x, ba.y) * Math.hypot(bc.x, bc.y)
  if (denominator === 0) return 0
  const cosine = Math.max(-1, Math.min(1, (ba.x * bc.x + ba.y * bc.y) / denominator))
  return Math.acos(cosine) * (180 / Math.PI)
}

function horizontalAngle(a: Landmark, b: Landmark) {
  const raw = Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI))
  return Math.abs(raw > 90 ? 180 - raw : raw)
}

function verticalDeviation(a: Landmark, b: Landmark) {
  return Math.abs(90 - horizontalAngle(a, b))
}

function isExerciseStartPose(exercise: ExerciseId, points: SidePoints) {
  const elbow = angle(points.shoulder, points.elbow, points.wrist)
  const knee = angle(points.hip, points.knee, points.ankle)
  const bodyLine = angle(points.shoulder, points.hip, points.ankle)
  const bodyFromHorizontal = horizontalAngle(points.shoulder, points.ankle)

  switch (exercise) {
    case 'push-up':
      return bodyFromHorizontal <= 40 && elbow >= 150 && bodyLine >= 145
    case 'squat':
      return bodyFromHorizontal >= 50 && knee >= 150 && points.shoulder.y < points.hip.y && points.hip.y < points.ankle.y
    case 'plank':
      return bodyFromHorizontal <= 38 && bodyLine >= 150
    case 'handstand':
      return verticalDeviation(points.wrist, points.ankle) <= 25 && elbow >= 150 && points.wrist.y > points.ankle.y + 0.20
    case 'front-lever':
      return bodyFromHorizontal <= 28 && elbow >= 150 && bodyLine >= 150
  }
}

function determinePhase(
  visibility: boolean,
  framing: boolean,
  orientation: boolean,
  stability: boolean,
  start: boolean
): CalibrationPhase {
  if (!visibility) return 'finding'
  if (!framing) return 'framing'
  if (!orientation) return 'orientation'
  if (!stability) return 'stability'
  if (!start) return 'start-position'
  return 'ready'
}

function phaseMessage(phase: CalibrationPhase, exercise: ExerciseId, bodyScale: number, insideFrame: boolean) {
  switch (phase) {
    case 'finding':
      return 'Step fully into view so your shoulder, wrist, hip, knee, and ankle are visible.'
    case 'framing':
      if (!insideFrame) return 'Move toward the center so your entire body stays inside the frame.'
      return bodyScale < 0.30 ? 'Move closer to the camera.' : 'Move farther away so your entire body fits.'
    case 'orientation':
      return 'Turn sideways to the camera until your shoulders and hips visually overlap.'
    case 'stability':
      return 'Hold still briefly while Formcheck checks camera stability.'
    case 'start-position':
      return startPoseMessage(exercise)
    case 'ready':
      return 'Calibration complete. Formcheck is ready.'
  }
}

function startPoseMessage(exercise: ExerciseId) {
  switch (exercise) {
    case 'push-up': return 'Hold the top of a push-up with straight arms and a firm body line.'
    case 'squat': return 'Stand tall with knees straight and your full body side-on.'
    case 'plank': return 'Hold a straight plank position without sagging or piking.'
    case 'handstand': return 'Hold a supported handstand with straight elbows and your full body visible.'
    case 'front-lever': return 'Hold your chosen front-lever start position with straight arms.'
  }
}

function pauseMessage(visibility: boolean, framing: boolean, orientation: boolean, startPose: boolean) {
  if (!visibility) return 'Tracking paused: required joints are not visible.'
  if (!framing) return 'Tracking paused: part of your body left the frame.'
  if (!orientation) return 'Tracking paused: return to a clear side view.'
  if (!startPose) return 'Tracking paused: return to the exercise position.'
  return 'Tracking paused. Hold still briefly.'
}

function calibrationProgress(
  visibility: boolean,
  framing: boolean,
  orientation: boolean,
  stableFrames: number,
  startFrames: number
) {
  let progress = 0
  if (visibility) progress += 20
  if (framing) progress += 20
  if (orientation) progress += 20
  progress += Math.round(20 * Math.min(stableFrames / STABLE_FRAMES_REQUIRED, 1))
  progress += Math.round(20 * Math.min(startFrames / START_FRAMES_REQUIRED, 1))
  return Math.min(progress, 100)
}

function buildChecks(
  visibilityPassed: boolean,
  framingPassed: boolean,
  orientationPassed: boolean,
  stabilityPassed: boolean,
  startPassed: boolean,
  visibility: number,
  bodyScale: number,
  sideRatio: number,
  stableFrames: number,
  startFrames: number
): CalibrationCheck[] {
  return [
    {
      id: 'visibility',
      label: 'Required joints visible',
      passed: visibilityPassed,
      detail: `${Math.round(visibility * 100)}% confidence`
    },
    {
      id: 'framing',
      label: 'Full body framed',
      passed: framingPassed,
      detail: `Body uses ${Math.round(bodyScale * 100)}% of frame`
    },
    {
      id: 'orientation',
      label: 'Clear side view',
      passed: orientationPassed,
      detail: `Side overlap ${Math.round(sideRatio * 100)}%`
    },
    {
      id: 'stability',
      label: 'Camera and body stable',
      passed: stabilityPassed,
      detail: `${Math.min(stableFrames, STABLE_FRAMES_REQUIRED)}/${STABLE_FRAMES_REQUIRED} frames`
    },
    {
      id: 'start-position',
      label: 'Starting position held',
      passed: startPassed,
      detail: `${Math.min(startFrames, START_FRAMES_REQUIRED)}/${START_FRAMES_REQUIRED} frames`
    }
  ]
}

function initialChecks(): CalibrationCheck[] {
  return [
    { id: 'visibility', label: 'Required joints visible', passed: false, detail: 'Waiting for body' },
    { id: 'framing', label: 'Full body framed', passed: false, detail: 'Waiting' },
    { id: 'orientation', label: 'Clear side view', passed: false, detail: 'Waiting' },
    { id: 'stability', label: 'Camera and body stable', passed: false, detail: 'Waiting' },
    { id: 'start-position', label: 'Starting position held', passed: false, detail: 'Waiting' }
  ]
}
