import type { RepCounterConfig, RepCounterState, RepCounterUpdate } from '../types'

export function createRepCounterState(): RepCounterState {
  return {
    phase: 'waiting',
    reps: 0,
    topFrames: 0,
    bottomFrames: 0,
    returnFrames: 0,
    repStartedAt: null,
    lastRepAt: null,
    smoothedAngle: null,
    previousRawAngle: null,
    minAngle: 180,
    maxAngle: 0,
    invalidFrames: 0
  }
}

export function updateRepCounter(
  current: RepCounterState,
  rawAngle: number,
  now: number,
  validPose: boolean,
  config: RepCounterConfig
): RepCounterUpdate {
  let state = { ...current }

  if (!validPose || !Number.isFinite(rawAngle)) {
    state.invalidFrames += 1
    state.topFrames = 0
    state.bottomFrames = 0
    state.returnFrames = 0
    if (state.invalidFrames >= config.invalidResetFrames) {
      state = resetAttempt(state, true)
    }
    return { state, counted: false, status: 'Move into the required camera position' }
  }

  state.invalidFrames = 0
  const suddenJump = state.previousRawAngle !== null && Math.abs(rawAngle - state.previousRawAngle) > config.maxFrameJump
  state.previousRawAngle = rawAngle

  if (suddenJump) {
    state = resetAttempt(state, false)
    state.previousRawAngle = rawAngle
    state.smoothedAngle = rawAngle
    return { state, counted: false, status: 'Tracking jump ignored—hold your position' }
  }

  const smoothedAngle = state.smoothedAngle === null
    ? rawAngle
    : state.smoothedAngle * config.smoothing + rawAngle * (1 - config.smoothing)
  state.smoothedAngle = smoothedAngle

  if (state.repStartedAt !== null && now - state.repStartedAt > config.maxRepDurationMs) {
    state = resetAttempt(state, false)
    state.smoothedAngle = smoothedAngle
    state.previousRawAngle = rawAngle
  }

  switch (state.phase) {
    case 'waiting': {
      state.topFrames = smoothedAngle >= config.topEnter ? state.topFrames + 1 : 0
      if (state.topFrames >= config.topStableFrames) {
        state.phase = 'ready'
        state.topFrames = config.topStableFrames
        state.minAngle = smoothedAngle
        state.maxAngle = smoothedAngle
      }
      return {
        state,
        counted: false,
        status: state.phase === 'ready' ? 'Counter armed—begin the rep' : 'Hold the starting position to arm the counter'
      }
    }

    case 'ready': {
      state.maxAngle = Math.max(state.maxAngle, smoothedAngle)
      if (smoothedAngle < config.topExit) {
        state.phase = 'descending'
        state.repStartedAt = now
        state.minAngle = smoothedAngle
        state.maxAngle = Math.max(state.maxAngle, smoothedAngle)
        state.bottomFrames = 0
      }
      return { state, counted: false, status: state.phase === 'descending' ? 'Rep started—continue through full range' : 'Counter armed' }
    }

    case 'descending': {
      state.minAngle = Math.min(state.minAngle, smoothedAngle)
      state.maxAngle = Math.max(state.maxAngle, smoothedAngle)
      state.bottomFrames = smoothedAngle <= config.bottomEnter ? state.bottomFrames + 1 : 0

      if (state.bottomFrames >= config.bottomStableFrames) {
        state.phase = 'bottom'
        return { state, counted: false, status: 'Bottom position confirmed—return to the start' }
      }

      if (smoothedAngle >= config.topEnter) {
        state = resetAttempt(state, false)
        state.phase = 'ready'
        state.topFrames = config.topStableFrames
        state.smoothedAngle = smoothedAngle
        state.previousRawAngle = rawAngle
        return { state, counted: false, status: 'Partial movement ignored' }
      }

      return { state, counted: false, status: 'Continue to the bottom position' }
    }

    case 'bottom': {
      state.minAngle = Math.min(state.minAngle, smoothedAngle)
      if (smoothedAngle > config.bottomExit) {
        state.phase = 'ascending'
        state.returnFrames = 0
      }
      return { state, counted: false, status: state.phase === 'ascending' ? 'Return to full lockout' : 'Bottom position confirmed' }
    }

    case 'ascending': {
      state.minAngle = Math.min(state.minAngle, smoothedAngle)
      state.maxAngle = Math.max(state.maxAngle, smoothedAngle)
      state.returnFrames = smoothedAngle >= config.topEnter ? state.returnFrames + 1 : 0

      if (smoothedAngle <= config.bottomEnter) {
        state.phase = 'bottom'
        state.returnFrames = 0
        return { state, counted: false, status: 'Bottom position reconfirmed' }
      }

      if (state.returnFrames < config.returnStableFrames) {
        return { state, counted: false, status: 'Finish and hold the starting position' }
      }

      const duration = state.repStartedAt === null ? 0 : now - state.repStartedAt
      const range = state.maxAngle - state.minAngle
      const cooledDown = state.lastRepAt === null || now - state.lastRepAt >= config.cooldownMs
      const validRep = duration >= config.minRepDurationMs &&
        duration <= config.maxRepDurationMs &&
        range >= config.minRange &&
        cooledDown

      if (!validRep) {
        const status = range < config.minRange
          ? 'Movement range was too small—rep ignored'
          : duration < config.minRepDurationMs
            ? 'Movement was too fast to verify—rep ignored'
            : 'Rep ignored—reset at the starting position'
        state = resetAttempt(state, false)
        state.phase = 'ready'
        state.topFrames = config.topStableFrames
        state.smoothedAngle = smoothedAngle
        state.previousRawAngle = rawAngle
        return { state, counted: false, status }
      }

      state.reps += 1
      state.lastRepAt = now
      state = resetAttempt(state, false)
      state.phase = 'ready'
      state.topFrames = config.topStableFrames
      state.smoothedAngle = smoothedAngle
      state.previousRawAngle = rawAngle
      return { state, counted: true, status: 'Rep confirmed' }
    }
  }
}

function resetAttempt(state: RepCounterState, loseTracking: boolean): RepCounterState {
  return {
    ...state,
    phase: loseTracking ? 'waiting' : state.phase,
    topFrames: 0,
    bottomFrames: 0,
    returnFrames: 0,
    repStartedAt: null,
    smoothedAngle: loseTracking ? null : state.smoothedAngle,
    previousRawAngle: loseTracking ? null : state.previousRawAngle,
    minAngle: 180,
    maxAngle: 0,
    invalidFrames: loseTracking ? state.invalidFrames : 0
  }
}
