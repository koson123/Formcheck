import { describe, expect, it } from 'vitest'
import type { Landmark, TrackedSide } from '../types'
import { createCalibrationState, updateCalibration } from './calibration'

const SIDE_INDICES = {
  left: [11, 13, 15, 23, 25, 27],
  right: [12, 14, 16, 24, 26, 28]
} satisfies Record<TrackedSide, number[]>

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

function bottomPushUpPose(): Landmark[] {
  const landmarks = pushUpPose()
  landmarks[13] = { x: 0.38, y: 0.61, visibility: 0.96 }
  landmarks[14] = { x: 0.39, y: 0.615, visibility: 0.92 }
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

function withSideVisibility(landmarks: Landmark[], side: TrackedSide, visibility: number) {
  const copy = landmarks.map((point) => ({ ...point }))
  for (const index of SIDE_INDICES[side]) copy[index].visibility = visibility
  return copy
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

  it('calibrates and locks the strongest visible body side', () => {
    const state = calibrate(Array.from({ length: 30 }, () => pushUpPose()))
    expect(state.calibrated).toBe(true)
    expect(state.trackingValid).toBe(true)
    expect(state.phase).toBe('ready')
    expect(state.progress).toBe(100)
    expect(state.recommendedSide).toBe('left')
    expect(state.lockedSide).toBe('left')
  })

  it('continues tracking after the user leaves the starting pose', () => {
    let state = calibrate(Array.from({ length: 30 }, () => pushUpPose()))
    state = updateCalibration('push-up', bottomPushUpPose(), state, true)

    expect(state.calibrated).toBe(true)
    expect(state.trackingValid).toBe(true)
    expect(state.lockedSide).toBe('left')
  })

  it('does not switch sides because the opposite side becomes slightly clearer', () => {
    let state = calibrate(Array.from({ length: 30 }, () => pushUpPose()))
    const frame = withSideVisibility(withSideVisibility(pushUpPose(), 'left', 0.80), 'right', 0.99)

    for (let index = 0; index < 20; index += 1) {
      state = updateCalibration('push-up', frame, state)
    }

    expect(state.recommendedSide).toBe('right')
    expect(state.lockedSide).toBe('left')
    expect(state.sideLossFrames).toBe(0)
    expect(state.sideSwitched).toBe(false)
  })

  it('switches only after sustained locked-side loss while no movement is active', () => {
    let state = calibrate(Array.from({ length: 30 }, () => pushUpPose()))
    const frame = withSideVisibility(withSideVisibility(pushUpPose(), 'left', 0.20), 'right', 0.96)

    for (let index = 0; index < 9; index += 1) {
      state = updateCalibration('push-up', frame, state, false)
      expect(state.lockedSide).toBe('left')
    }

    state = updateCalibration('push-up', frame, state, false)
    expect(state.lockedSide).toBe('right')
    expect(state.sideSwitched).toBe(true)
    expect(state.trackingValid).toBe(true)
  })

  it('requires the active attempt to reset before switching sides', () => {
    let state = calibrate(Array.from({ length: 30 }, () => pushUpPose()))
    const frame = withSideVisibility(withSideVisibility(pushUpPose(), 'left', 0.20), 'right', 0.96)

    for (let index = 0; index < 10; index += 1) {
      state = updateCalibration('push-up', frame, state, true)
    }

    expect(state.lockedSide).toBe('left')
    expect(state.sideSwitchPending).toBe(true)
    expect(state.trackingValid).toBe(false)

    state = updateCalibration('push-up', frame, state, false)
    expect(state.lockedSide).toBe('right')
    expect(state.sideSwitched).toBe(true)
    expect(state.sideSwitchPending).toBe(false)
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
    expect(state.lockedSide).toBe(null)
  })
})
