import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { Landmark } from '../types'

let landmarkerPromise: Promise<PoseLandmarker> | null = null

const connections: Array<[number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [24, 26], [26, 28], [27, 31], [28, 32]
]

function assetUrl(path: string) {
  return new URL(path, window.location.href).toString()
}

export async function getPoseLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(assetUrl('mediapipe/wasm'))
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: assetUrl('mediapipe/models/pose_landmarker_lite.task')
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.55,
        minPosePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
        outputSegmentationMasks: false
      })
    })()
  }
  return landmarkerPromise
}

export function drawPose(canvas: HTMLCanvasElement, landmarks: Landmark[], width: number, height: number) {
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return

  context.clearRect(0, 0, width, height)
  context.lineWidth = Math.max(2, width / 360)
  context.lineCap = 'round'
  context.strokeStyle = '#5eead4'
  context.fillStyle = '#f8fafc'

  for (const [start, end] of connections) {
    const a = landmarks[start]
    const b = landmarks[end]
    if (!a || !b || (a.visibility ?? 1) < 0.45 || (b.visibility ?? 1) < 0.45) continue
    context.beginPath()
    context.moveTo(a.x * width, a.y * height)
    context.lineTo(b.x * width, b.y * height)
    context.stroke()
  }

  for (const index of new Set(connections.flat())) {
    const point = landmarks[index]
    if (!point || (point.visibility ?? 1) < 0.45) continue
    context.beginPath()
    context.arc(point.x * width, point.y * height, Math.max(3, width / 200), 0, Math.PI * 2)
    context.fill()
  }
}

export function clearPose(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
}
