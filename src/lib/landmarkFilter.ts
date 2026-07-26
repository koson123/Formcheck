import type { Landmark } from '../types'

const MIN_ALPHA = 0.16
const MAX_ALPHA = 0.82
const SPEED_FOR_MAX_ALPHA = 3.2
const LOW_CONFIDENCE_THRESHOLD = 0.35
const OUTLIER_DISTANCE = 0.16
const OUTLIER_ALPHA_CAP = 0.10
const MAX_POINT_LOSS_FRAMES = 6
const MAX_MISSING_POSE_FRAMES = 8

export type LandmarkFilterState = {
  points: Array<FilteredPoint | null>
  lastTimestamp: number | null
  missingPoseFrames: number
}

type FilteredPoint = {
  landmark: Landmark
  lowConfidenceFrames: number
}

export type LandmarkFilterUpdate = {
  landmarks: Landmark[]
  state: LandmarkFilterState
}

export function createLandmarkFilterState(): LandmarkFilterState {
  return {
    points: [],
    lastTimestamp: null,
    missingPoseFrames: 0
  }
}

export function stabilizeLandmarks(
  rawLandmarks: Landmark[],
  current: LandmarkFilterState,
  timestamp = performance.now()
): LandmarkFilterUpdate {
  if (!rawLandmarks.length) {
    const missingPoseFrames = current.missingPoseFrames + 1
    if (missingPoseFrames >= MAX_MISSING_POSE_FRAMES) {
      return { landmarks: [], state: createLandmarkFilterState() }
    }
    return {
      landmarks: [],
      state: { ...current, missingPoseFrames }
    }
  }

  const deltaSeconds = current.lastTimestamp === null
    ? 1 / 30
    : clamp((timestamp - current.lastTimestamp) / 1000, 1 / 120, 0.12)

  const points = rawLandmarks.map((raw, index) => {
    const previous = current.points[index]
    const confidence = landmarkConfidence(raw)

    if (!previous) {
      return {
        landmark: copyLandmark(raw),
        lowConfidenceFrames: confidence < LOW_CONFIDENCE_THRESHOLD ? 1 : 0
      }
    }

    if (confidence < LOW_CONFIDENCE_THRESHOLD) {
      const lowConfidenceFrames = previous.lowConfidenceFrames + 1
      if (lowConfidenceFrames >= MAX_POINT_LOSS_FRAMES) {
        return null
      }
      return {
        landmark: {
          ...previous.landmark,
          visibility: raw.visibility,
          presence: raw.presence
        },
        lowConfidenceFrames
      }
    }

    const movement = landmarkDistance(previous.landmark, raw)
    const speed = movement / deltaSeconds
    const motionAmount = clamp(speed / SPEED_FOR_MAX_ALPHA, 0, 1)
    const confidenceAmount = clamp((confidence - LOW_CONFIDENCE_THRESHOLD) / (1 - LOW_CONFIDENCE_THRESHOLD), 0, 1)
    let alpha = MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * motionAmount
    alpha *= 0.72 + confidenceAmount * 0.28

    if (movement >= OUTLIER_DISTANCE && previous.lowConfidenceFrames === 0) {
      alpha = Math.min(alpha, OUTLIER_ALPHA_CAP)
    }

    return {
      landmark: blendLandmark(previous.landmark, raw, alpha),
      lowConfidenceFrames: 0
    }
  })

  return {
    landmarks: points.map((point, index) => point?.landmark ?? copyLandmark(rawLandmarks[index])),
    state: {
      points,
      lastTimestamp: timestamp,
      missingPoseFrames: 0
    }
  }
}

function blendLandmark(previous: Landmark, raw: Landmark, alpha: number): Landmark {
  return {
    x: lerp(previous.x, raw.x, alpha),
    y: lerp(previous.y, raw.y, alpha),
    z: raw.z === undefined
      ? previous.z
      : previous.z === undefined
        ? raw.z
        : lerp(previous.z, raw.z, alpha),
    visibility: raw.visibility,
    presence: raw.presence
  }
}

function copyLandmark(landmark: Landmark): Landmark {
  return { ...landmark }
}

function landmarkConfidence(landmark: Landmark) {
  return landmark.visibility ?? landmark.presence ?? 1
}

function landmarkDistance(a: Landmark, b: Landmark) {
  const zDistance = a.z === undefined || b.z === undefined ? 0 : a.z - b.z
  return Math.hypot(a.x - b.x, a.y - b.y, zDistance)
}

function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}
