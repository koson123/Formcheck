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

export type AnalyzerMemory = {
  phase: 'ready' | 'lowered' | 'holding'
  reps: number
  holdStartedAt: number | null
  holdSeconds: number
  lastCue: string
}

export type AnalysisResult = {
  score: number
  headline: string
  cue: string
  positives: string[]
  metrics: Array<{ label: string; value: string; good: boolean }>
  memory: AnalyzerMemory
}
