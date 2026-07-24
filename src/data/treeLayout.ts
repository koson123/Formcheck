import type { SkillCategory } from '../types'

export type TreeSection = {
  id: string
  title: string
  subtitle: string
  category: SkillCategory
  skillIds: string[]
}

export const treeSections: TreeSection[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    subtitle: 'Body control and preparation',
    category: 'foundation',
    skillIds: ['body-awareness', 'wrist-prep', 'shoulder-flexion', 'hollow-hold', 'plank', 'active-hang']
  },
  {
    id: 'horizontal-push',
    title: 'Horizontal Push',
    subtitle: 'Push-up strength',
    category: 'push',
    skillIds: ['push-up', 'diamond-push-up', 'archer-push-up', 'one-arm-push-up']
  },
  {
    id: 'planche',
    title: 'Planche',
    subtitle: 'Straight-arm pushing',
    category: 'push',
    skillIds: ['pseudo-planche-push-up', 'planche-lean', 'frog-stand', 'tuck-planche', 'advanced-tuck-planche', 'straddle-planche', 'full-planche']
  },
  {
    id: 'hand-balance',
    title: 'Hand Balance',
    subtitle: 'Balance and line',
    category: 'balance',
    skillIds: ['wall-handstand', 'handstand', 'press-handstand']
  },
  {
    id: 'vertical-push',
    title: 'Vertical Push',
    subtitle: 'Overhead pressing',
    category: 'push',
    skillIds: ['pike-push-up', 'wall-hspu', 'handstand-push-up']
  },
  {
    id: 'vertical-pull',
    title: 'Vertical Pull',
    subtitle: 'Pull-up strength',
    category: 'pull',
    skillIds: ['scap-pull', 'negative-pull-up', 'pull-up', 'chest-to-bar', 'archer-pull-up', 'one-arm-pull-up']
  },
  {
    id: 'muscle-up',
    title: 'Muscle-up',
    subtitle: 'Pull, transition, press',
    category: 'pull',
    skillIds: ['straight-bar-dip', 'muscle-up', 'strict-muscle-up']
  },
  {
    id: 'front-lever',
    title: 'Front Lever',
    subtitle: 'Horizontal pull front',
    category: 'pull',
    skillIds: ['front-lever-tuck', 'front-lever-advanced-tuck', 'front-lever-one-leg', 'front-lever-straddle', 'front-lever-full']
  },
  {
    id: 'back-lever',
    title: 'Back Lever',
    subtitle: 'Horizontal pull back',
    category: 'pull',
    skillIds: ['skin-the-cat', 'tuck-back-lever', 'advanced-tuck-back-lever', 'straddle-back-lever', 'full-back-lever']
  },
  {
    id: 'compression',
    title: 'Compression',
    subtitle: 'L-sit through manna',
    category: 'core',
    skillIds: ['pike-flexibility', 'tuck-lsit', 'one-leg-lsit', 'lsit', 'vsit', 'manna']
  },
  {
    id: 'legs',
    title: 'Legs',
    subtitle: 'Single-leg strength',
    category: 'legs',
    skillIds: ['bodyweight-squat', 'split-squat', 'assisted-pistol', 'pistol-squat', 'shrimp-squat']
  }
]

export const sectionBySkillId = new Map(
  treeSections.flatMap((section) => section.skillIds.map((skillId) => [skillId, section] as const))
)
