import { describe, expect, it } from 'vitest'
import type { Landmark } from '../types'
import { analyzeForm, createAnalyzerMemory } from './formRules'

function asymmetricPushUpPose(): Landmark[] {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }))

  landmarks[11] = { x: 0.28, y: 0.48, visibility: 0.96 }
  landmarks[13] = { x: 0.38, y: 0.48, visibility: 0.96 }
  landmarks[15] = { x: 0.48, y: 0.48, visibility: 0.96 }
  landmarks[23] = { x: 0.56, y: 0.49, visibility: 0.96 }
  landmarks[25] = { x: 0.72, y: 0.50, visibility: 0.96 }
  landmarks[27] = { x: 0.88, y: 0.51, visibility: 0.96 }

  landmarks[12] = { x: 0.29, y: 0.485, visibility: 0.96 }
  landmarks[14] = { x: 0.39, y: 0.615, visibility: 0.96 }
  landmarks[16] = { x: 0.49, y: 0.485, visibility: 0.96 }
  landmarks[24] = { x: 0.57, y: 0.495, visibility: 0.96 }
  landmarks[26] = { x: 0.73, y: 0.505, visibility: 0.96 }
  landmarks[28] = { x: 0.89, y: 0.515, visibility: 0.96 }

  return landmarks
}

function metricAngle(result: ReturnType<typeof analyzeForm>, label: string) {
  const value = result.metrics.find((metric) => metric.label === label)?.value ?? '0°'
  return Number.parseInt(value, 10)
}

describe('locked-side form analysis', () => {
  it('uses the requested side instead of whichever side is clearer on the current frame', () => {
    const landmarks = asymmetricPushUpPose()
    const left = analyzeForm('push-up', landmarks, createAnalyzerMemory(), 'left', 0)
    const right = analyzeForm('push-up', landmarks, createAnalyzerMemory(), 'right', 0)

    expect(metricAngle(left, 'Elbow angle')).toBeGreaterThan(160)
    expect(metricAngle(right, 'Elbow angle')).toBeLessThan(120)
  })
})
