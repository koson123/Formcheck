import { describe, expect, it } from 'vitest'
import type { Landmark } from '../types'
import { createCalibrationState, updateCalibration } from './calibration'

function blankLandmarks(): Landmark[] {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }))
}

function pushUpPose(offsetX = 0): Landmark[] {
  const landmarks = blankLandmarks()
  const set = (leftIndex: number, rightIndex: number, x: number, y: number) => {
    landmarks[leftIndex] = { x: x + offsetX, y, visibility: 0.96 }
    landmarks[rightIndex] = { x: x + 0.01 + offsetX, y: y + 0.005, visibility: 0.92 }
  }

  set(11, 12, 0.28, 0.48)
  set(13, 14, 0.38, 0.48)
  set(15, 16, 0.48, 0.48)
  set(23, 24, 0.56, 0.49)
  set(25, 26, 0.72, 0.50)
  set(27, 28, 0.88, 0.51)
  return landmarks
}

function frontFacingPushUpPose(): Landmark[] {
  const landmarks = pushUpPose()
  landmarks[11] = { x: 0.28, y: 0.48, visibility: 0.96 }
  landmarks[12] = { x: 0.48, y: 0.48, visibility: 0.96 }
  landmarks[23] = { x: 0.56, y: 0.49, visibility: 0.96 }
  landmarks[24] = { x: 0.76, y: 0.49, visibility: 0.96 }
  return landmarks
}

function calibrate(frames: Landmark[][]) {
  let state = createCalibrationState()
  for (const landmarks of frames) {
    state = updateCalibration('push-up', landmarks, state)
  }
  return state
}

describe('camera readiness calibration', () => {
  it('waits when the required body landmarks are not visible', () => {
    const state = updateCalibration('push-up', blankLandmarks(), createCalibrationState())
    expect(state.calibrated).toBe(false)
    expect(state.phase).toBe('finding')
    expect(state.checks[0].passed).toBe(false)
  })

  it('rejects a front-facing setup when a side view is required', () => {
    const state = calibrate(Array.from({ length: 30 }, () => frontFacingPushUpPose()))
    expect(state.calibrated).toBe(false)
    expect(state.phase).toBe('orientation')
    expect(state.checks.find((check) => check.id === 'orientation')?.passed).toBe(false)
  })

  it('does not calibrate while the person is moving around the frame', () => {
    const frames = Array.from({ length: 40 }, (_, index) => pushUpPose(index % 2 === 0 ? 0 : 0.04))
    const state = calibrate(frames)
    expect(state.calibrated).toBe(false)
    expect(state.phase).toBe('stability')
    expect(state.stableFrames).toBeLessThan(12)
  })

  it('calibrates after a stable full-body side-view starting pose', () => {
    const state = calibrate(Array.from({ length: 30 }, () => pushUpPose()))
    expect(state.calibrated).toBe(true)
    expect(state.trackingValid).toBe(true)
    expect(state.phase).toBe('ready')
    expect(state.progress).toBe(100)
    expect(state.recommendedSide).toBe('left')
  })

  it('briefly pauses before requiring full recalibration after tracking loss', () => {
    let state = calibrate(Array.from({ length: 30 }, () => pushUpPose()))

    state = updateCalibration('push-up', blankLandmarks(), state)
    expect(state.calibrated).toBe(true)
    expect(state.trackingValid).toBe(false)

    for (let index = 0; index < 12; index += 1) {
      state = updateCalibration('push-up', blankLandmarks(), state)
    }

    expect(state.calibrated).toBe(false)
    expect(state.phase).toBe('finding')
  })
})
