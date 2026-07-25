import type { SkillCategory } from '../types'

export type TreeZoneId =
  | 'horizontal-push'
  | 'vertical-push'
  | 'horizontal-pull'
  | 'vertical-pull'
  | 'core'
  | 'legs'

export type TreeZone = {
  id: TreeZoneId
  title: string
  category: SkillCategory
  x: number
  y: number
}

export type TreePlacement = {
  skillId: string
  zone: TreeZoneId
  x: number
  y: number
}

export const treeZones: TreeZone[] = [
  { id: 'horizontal-push', title: 'HORIZONTAL PUSH', category: 'push', x: 110, y: 900 },
  { id: 'vertical-push', title: 'VERTICAL PUSH', category: 'push', x: 850, y: 245 },
  { id: 'horizontal-pull', title: 'HORIZONTAL PULL', category: 'pull', x: 1630, y: 90 },
  { id: 'vertical-pull', title: 'VERTICAL PULL', category: 'pull', x: 2100, y: 820 },
  { id: 'core', title: 'CORE', category: 'core', x: 1110, y: 915 },
  { id: 'legs', title: 'LEGS', category: 'legs', x: 1535, y: 1390 }
]

export const treePlacements: TreePlacement[] = [
  // Horizontal push and planche
  { skillId: 'plank', zone: 'horizontal-push', x: 520, y: 1120 },
  { skillId: 'push-up', zone: 'horizontal-push', x: 520, y: 980 },
  { skillId: 'diamond-push-up', zone: 'horizontal-push', x: 360, y: 820 },
  { skillId: 'archer-push-up', zone: 'horizontal-push', x: 560, y: 800 },
  { skillId: 'one-arm-push-up', zone: 'horizontal-push', x: 560, y: 620 },
  { skillId: 'pseudo-planche-push-up', zone: 'horizontal-push', x: 740, y: 820 },
  { skillId: 'planche-lean', zone: 'horizontal-push', x: 740, y: 660 },
  { skillId: 'tuck-planche', zone: 'horizontal-push', x: 740, y: 500 },
  { skillId: 'advanced-tuck-planche', zone: 'horizontal-push', x: 740, y: 350 },
  { skillId: 'straddle-planche', zone: 'horizontal-push', x: 660, y: 190 },
  { skillId: 'full-planche', zone: 'horizontal-push', x: 740, y: 60 },

  // Vertical push and hand balance
  { skillId: 'wrist-prep', zone: 'vertical-push', x: 900, y: 1120 },
  { skillId: 'shoulder-flexion', zone: 'vertical-push', x: 1030, y: 1050 },
  { skillId: 'frog-stand', zone: 'vertical-push', x: 900, y: 900 },
  { skillId: 'pike-push-up', zone: 'vertical-push', x: 1080, y: 860 },
  { skillId: 'wall-handstand', zone: 'vertical-push', x: 980, y: 750 },
  { skillId: 'wall-hspu', zone: 'vertical-push', x: 1110, y: 680 },
  { skillId: 'handstand', zone: 'vertical-push', x: 980, y: 570 },
  { skillId: 'handstand-push-up', zone: 'vertical-push', x: 1110, y: 480 },
  { skillId: 'press-handstand', zone: 'vertical-push', x: 980, y: 370 },

  // Horizontal pull: front and back lever families
  { skillId: 'active-hang', zone: 'horizontal-pull', x: 1650, y: 1080 },
  { skillId: 'scap-pull', zone: 'horizontal-pull', x: 1650, y: 930 },
  { skillId: 'front-lever-tuck', zone: 'horizontal-pull', x: 1540, y: 780 },
  { skillId: 'front-lever-advanced-tuck', zone: 'horizontal-pull', x: 1540, y: 620 },
  { skillId: 'front-lever-one-leg', zone: 'horizontal-pull', x: 1460, y: 460 },
  { skillId: 'front-lever-straddle', zone: 'horizontal-pull', x: 1540, y: 300 },
  { skillId: 'front-lever-full', zone: 'horizontal-pull', x: 1540, y: 140 },
  { skillId: 'skin-the-cat', zone: 'horizontal-pull', x: 1810, y: 860 },
  { skillId: 'tuck-back-lever', zone: 'horizontal-pull', x: 1810, y: 700 },
  { skillId: 'advanced-tuck-back-lever', zone: 'horizontal-pull', x: 1810, y: 540 },
  { skillId: 'straddle-back-lever', zone: 'horizontal-pull', x: 1890, y: 380 },
  { skillId: 'full-back-lever', zone: 'horizontal-pull', x: 1890, y: 220 },

  // Vertical pull and muscle-up
  { skillId: 'negative-pull-up', zone: 'vertical-pull', x: 2060, y: 900 },
  { skillId: 'pull-up', zone: 'vertical-pull', x: 2060, y: 740 },
  { skillId: 'chest-to-bar', zone: 'vertical-pull', x: 2060, y: 580 },
  { skillId: 'archer-pull-up', zone: 'vertical-pull', x: 2220, y: 580 },
  { skillId: 'one-arm-pull-up', zone: 'vertical-pull', x: 2220, y: 400 },
  { skillId: 'straight-bar-dip', zone: 'vertical-pull', x: 1920, y: 520 },
  { skillId: 'muscle-up', zone: 'vertical-pull', x: 2060, y: 400 },
  { skillId: 'strict-muscle-up', zone: 'vertical-pull', x: 2060, y: 220 },

  // Core and compression
  { skillId: 'body-awareness', zone: 'core', x: 1120, y: 1180 },
  { skillId: 'hollow-hold', zone: 'core', x: 1200, y: 1060 },
  { skillId: 'pike-flexibility', zone: 'core', x: 1240, y: 1240 },
  { skillId: 'tuck-lsit', zone: 'core', x: 1260, y: 940 },
  { skillId: 'one-leg-lsit', zone: 'core', x: 1260, y: 800 },
  { skillId: 'lsit', zone: 'core', x: 1260, y: 660 },
  { skillId: 'vsit', zone: 'core', x: 1260, y: 500 },
  { skillId: 'manna', zone: 'core', x: 1260, y: 340 },

  // Legs
  { skillId: 'bodyweight-squat', zone: 'legs', x: 1460, y: 1500 },
  { skillId: 'split-squat', zone: 'legs', x: 1460, y: 1360 },
  { skillId: 'assisted-pistol', zone: 'legs', x: 1460, y: 1220 },
  { skillId: 'pistol-squat', zone: 'legs', x: 1460, y: 1080 },
  { skillId: 'shrimp-squat', zone: 'legs', x: 1460, y: 940 }
]

export const placementBySkillId = new Map(
  treePlacements.map((placement) => [placement.skillId, placement] as const)
)

export const rootSkillIds = new Set([
  'body-awareness',
  'wrist-prep',
  'shoulder-flexion',
  'plank',
  'active-hang',
  'pike-flexibility',
  'bodyweight-squat'
])
