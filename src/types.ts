export type AppPage = 'tree' | 'form' | 'about'

export type SkillCategory =
  | 'foundation'
  | 'push'
  | 'pull'
  | 'balance'
  | 'core'
  | 'legs'
  | 'mobility'

export type Difficulty = 'Foundation' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite'

export type SkillProgressStatus = 'locked' | 'unlocked' | 'in-progress' | 'mastered'

export type Skill = {
  id: string
  name: string
  category: SkillCategory
  difficulty: Difficulty
  x: number
  y: number
  summary: string
  standard: string
  prerequisites: string[]
  leadsTo: string[]
  cues: string[]
  commonMistakes: string[]
  analyzerExercise?: ExerciseId
  cameraAngle?: string
}

export type SkillLink = {
  source: string
  target: string
}

export type ExerciseId = 'push-up' | 'squat' | 'plank' | 'handstand' | 'front-lever'

export type ExerciseDefinition = {
  id: ExerciseId
  name: string
  mode: 'dynamic' | 'static'
  cameraAngle: string
  setup: string[]
  tracked: string[]
}

export type Landmark = {
  x: number
  y: number
  z?: number
  visibility?: number
  presence?: number
}

export type TrackedSide = 'left' | 'right'

export type CalibrationPhase =
  | 'finding'
  | 'framing'
  | 'orientation'
  | 'stability'
  | 'start-position'
  | 'ready'

export type CalibrationCheckId = 'visibility' | 'framing' | 'orientation' | 'stability' | 'start-position'

export type CalibrationCheck = {
  id: CalibrationCheckId
  label: string
  passed: boolean
  detail: string
}

export type CalibrationState = {
  phase: CalibrationPhase
  calibrated: boolean
  trackingValid: boolean
  recommendedSide: TrackedSide | null
  lockedSide: TrackedSide | null
  sideLossFrames: number
  sideSwitched: boolean
  sideSwitchPending: boolean
  stableFrames: number
  startFrames: number
  invalidFrames: number
  lastCenter: { x: number; y: number } | null
  lastScale: number | null
  bodyScale: number | null
  progress: number
  message: string
  checks: CalibrationCheck[]
}

export type RepPhase = 'waiting' | 'ready' | 'descending' | 'bottom' | 'ascending'

export type RepCounterState = {
  phase: RepPhase
  reps: number
  topFrames: number
  bottomFrames: number
  returnFrames: number
  repStartedAt: number | null
  lastRepAt: number | null
  smoothedAngle: number | null
  previousRawAngle: number | null
  minAngle: number
  maxAngle: number
  invalidFrames: number
}

export type RepCounterConfig = {
  topEnter: number
  topExit: number
  bottomEnter: number
  bottomExit: number
  topStableFrames: number
  bottomStableFrames: number
  returnStableFrames: number
  minRange: number
  minRepDurationMs: number
  maxRepDurationMs: number
  cooldownMs: number
  maxFrameJump: number
  invalidResetFrames: number
  smoothing: number
}

export type RepCounterUpdate = {
  state: RepCounterState
  counted: boolean
  status: string
}

export type AnalyzerMemory = {
  phase: 'ready' | 'holding'
  reps: number
  holdStartedAt: number | null
  holdSeconds: number
  lastCue: string
  repCounter: RepCounterState
}

export type AnalysisResult = {
  score: number
  headline: string
  cue: string
  positives: string[]
  metrics: Array<{ label: string; value: string; good: boolean }>
  memory: AnalyzerMemory
}
