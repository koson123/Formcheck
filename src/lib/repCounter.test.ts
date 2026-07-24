import { describe, expect, it } from 'vitest'
import type { RepCounterConfig, RepCounterState } from '../types'
import { createRepCounterState, updateRepCounter } from './repCounter'

const config: RepCounterConfig = {
  topEnter: 158,
  topExit: 145,
  bottomEnter: 105,
  bottomExit: 120,
  topStableFrames: 6,
  bottomStableFrames: 4,
  returnStableFrames: 5,
  minRange: 48,
  minRepDurationMs: 500,
  maxRepDurationMs: 9000,
  cooldownMs: 400,
  maxFrameJump: 28,
  invalidResetFrames: 3,
  smoothing: 0.6
}

function feed(
  angles: number[],
  state = createRepCounterState(),
  start = 0,
  validPose = true,
  frameMs = 60
) {
  let next = state
  let counted = 0
  angles.forEach((angle, index) => {
    const update = updateRepCounter(next, angle, start + index * frameMs, validPose, config)
    next = update.state
    if (update.counted) counted += 1
  })
  return { state: next, counted, end: start + angles.length * frameMs }
}

function fullRepSequence() {
  return [
    ...Array(8).fill(166),
    154, 144, 134, 124, 114, 104, 98,
    ...Array(7).fill(96),
    108, 120, 132, 144, 154, 162, 166,
    ...Array(8).fill(166)
  ]
}

describe('rep counter', () => {
  it('counts one stable full-range rep', () => {
    const result = feed(fullRepSequence())
    expect(result.counted).toBe(1)
    expect(result.state.reps).toBe(1)
    expect(result.state.phase).toBe('ready')
  })

  it('does not count ordinary body movement before a stable start pose', () => {
    const result = feed([140, 125, 110, 95, 115, 135, 155, 140, 120, 100, 130, 150])
    expect(result.counted).toBe(0)
    expect(result.state.reps).toBe(0)
  })

  it('ignores a one-frame bottom-position tracking glitch', () => {
    const result = feed([...Array(8).fill(166), 164, 101, 164, ...Array(8).fill(166)])
    expect(result.counted).toBe(0)
    expect(result.state.reps).toBe(0)
  })

  it('ignores partial reps that never reach the bottom threshold', () => {
    const result = feed([
      ...Array(8).fill(166),
      154, 146, 138, 132, 130, 134, 142, 150, 160,
      ...Array(8).fill(166)
    ])
    expect(result.counted).toBe(0)
    expect(result.state.reps).toBe(0)
  })

  it('pauses and resets the attempt when the exercise pose is invalid', () => {
    let state: RepCounterState = createRepCounterState()
    const armed = feed(Array(8).fill(166), state)
    state = armed.state

    const invalid = feed([150, 135, 115, 100, 120, 145, 166], state, armed.end, false)
    expect(invalid.counted).toBe(0)
    expect(invalid.state.reps).toBe(0)
    expect(invalid.state.phase).toBe('waiting')
  })
})
