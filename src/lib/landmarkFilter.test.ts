import { describe, expect, it } from 'vitest'
import type { Landmark } from '../types'
import { createLandmarkFilterState, stabilizeLandmarks } from './landmarkFilter'

function frame(x: number, y = 0.5, visibility = 0.95): Landmark[] {
  return [{ x, y, z: 0, visibility, presence: visibility }]
}

function runSequence(values: number[]) {
  let state = createLandmarkFilterState()
  const outputs: number[] = []
  values.forEach((value, index) => {
    const update = stabilizeLandmarks(frame(value), state, index * 33)
    state = update.state
    outputs.push(update.landmarks[0].x)
  })
  return outputs
}

function totalTravel(values: number[]) {
  return values.slice(1).reduce((total, value, index) => total + Math.abs(value - values[index]), 0)
}

describe('adaptive landmark stabilization', () => {
  it('reduces small stationary jitter', () => {
    const raw = [0.5, 0.515, 0.487, 0.512, 0.491, 0.508, 0.494, 0.505]
    const filtered = runSequence(raw)

    expect(totalTravel(filtered)).toBeLessThan(totalTravel(raw) * 0.7)
    expect(Math.abs(filtered.at(-1)! - 0.5)).toBeLessThan(0.012)
  })

  it('remains responsive to sustained deliberate movement', () => {
    const filtered = runSequence([0.5, 0.52, 0.56, 0.61, 0.67, 0.73, 0.78, 0.8])

    expect(filtered.at(-1)).toBeGreaterThan(0.74)
    expect(filtered[4]).toBeGreaterThan(0.60)
  })

  it('dampens a one-frame landmark teleport', () => {
    const filtered = runSequence([0.5, 0.5, 0.5, 0.91, 0.5, 0.5])

    expect(filtered[3]).toBeLessThan(0.56)
    expect(Math.abs(filtered.at(-1)! - 0.5)).toBeLessThan(0.02)
  })

  it('holds geometry briefly while preserving low confidence for downstream checks', () => {
    let state = createLandmarkFilterState()
    let update = stabilizeLandmarks(frame(0.5), state, 0)
    state = update.state

    update = stabilizeLandmarks(frame(0.72, 0.5, 0.1), state, 33)

    expect(update.landmarks[0].x).toBeCloseTo(0.5)
    expect(update.landmarks[0].visibility).toBe(0.1)
  })

  it('resets stale geometry after sustained pose loss', () => {
    let state = createLandmarkFilterState()
    state = stabilizeLandmarks(frame(0.5), state, 0).state

    for (let index = 1; index <= 8; index += 1) {
      state = stabilizeLandmarks([], state, index * 33).state
    }

    const recovered = stabilizeLandmarks(frame(0.82), state, 330)
    expect(recovered.landmarks[0].x).toBeCloseTo(0.82)
  })

  it('stabilizes depth coordinates as well as screen coordinates', () => {
    let state = createLandmarkFilterState()
    let update = stabilizeLandmarks([{ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }], state, 0)
    state = update.state
    update = stabilizeLandmarks([{ x: 0.5, y: 0.5, z: 0.08, visibility: 0.95 }], state, 33)

    expect(update.landmarks[0].z).toBeGreaterThan(0)
    expect(update.landmarks[0].z).toBeLessThan(0.08)
  })
})
