import { domain01Paths } from './domain01'
import { domain02Paths } from './domain02'
import { domain03Paths } from './domain03'
import { domain04Paths } from './domain04'
import { domain05Paths } from './domain05'
import { domain06Paths } from './domain06'
import { domain07Paths } from './domain07'
import { domain08Paths } from './domain08'
import { domain09Paths } from './domain09'
import { domain10Paths } from './domain10'

export const RANKS = ['Locked', 'Discovered', 'Capable', 'Reliable', 'Advanced', 'Mastered'] as const

export type AtlasDomain = {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export type AtlasPathBlueprint = {
  id: string
  domainId: string
  domain: string
  name: string
  goal: string
  skills: string[]
}

export type AtlasSkill = {
  id: string
  domainId: string
  domain: string
  pathId: string
  path: string
  tier: number
  name: string
  description: string
  proof: string
  estimatedHours: number
  maintenanceMinutesPerMonth: number
  power: number
  synergy: number
  prerequisiteIds: string[]
  goldenPath: boolean
}

export const atlasDomains: AtlasDomain[] = [
  { id: 'D01', name: 'Physical Engine', description: 'Build strength, speed, mobility, endurance, and recovery that transfer into real life.', icon: 'dumbbell', color: '#58e6c1' },
  { id: 'D02', name: 'Movement and Defense', description: 'Move confidently through the world and protect yourself without reckless training.', icon: 'swords', color: '#ff8da1' },
  { id: 'D03', name: 'Supermind', description: 'Learn faster, focus longer, reason clearly, and turn knowledge into practical ability.', icon: 'brain', color: '#b99cff' },
  { id: 'D04', name: 'Awareness', description: 'Notice what others miss, understand environments, and detect meaningful patterns.', icon: 'eye', color: '#67c7ff' },
  { id: 'D05', name: 'Communication', description: 'Connect, explain, persuade, teach, lead, and resolve conflict with integrity.', icon: 'message-circle', color: '#ffd166' },
  { id: 'D06', name: 'Technology', description: 'Control modern digital systems through programming, AI, networks, and automation.', icon: 'cpu', color: '#64e8ff' },
  { id: 'D07', name: 'Builder', description: 'Repair, design, fabricate, and prototype useful physical systems.', icon: 'wrench', color: '#ffa45b' },
  { id: 'D08', name: 'Survival and Rescue', description: 'Stay useful in emergencies and help protect other people when systems fail.', icon: 'shield', color: '#7ee787' },
  { id: 'D09', name: 'Life Mastery', description: 'Build the routines, health, finances, and organization that support every other power.', icon: 'heart-pulse', color: '#ff78c6' },
  { id: 'D10', name: 'Expression and Influence', description: 'Create memorable work, understand cultures, and leave useful value behind.', icon: 'sparkles', color: '#f9e06f' }
]

export const atlasPaths = [
  ...domain01Paths,
  ...domain02Paths,
  ...domain03Paths,
  ...domain04Paths,
  ...domain05Paths,
  ...domain06Paths,
  ...domain07Paths,
  ...domain08Paths,
  ...domain09Paths,
  ...domain10Paths
]

const HOURS = [0, 0.5, 1, 2, 3, 5, 8, 12, 20, 35, 60]
const MAINTENANCE = [0, 0, 5, 5, 10, 10, 15, 15, 20, 30, 45]
const POWER = [0, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]
const SYNERGY = [0, 8, 7, 7, 7, 6, 6, 6, 5, 5, 5]
const GOLDEN_PATHS = new Set(['P01', 'P05', 'P11', 'P21', 'P23', 'P31', 'P32', 'P41', 'P52', 'P70', 'P71', 'P72'])
const PROOFS = [
  '',
  'Explain the basics and complete one safe beginner drill.',
  'Repeat the skill correctly with a checklist or reference.',
  'Demonstrate the skill independently in a controlled situation.',
  'Use the skill to complete one small real-world task.',
  'Demonstrate reliable performance on three separate days.',
  'Apply the skill under mild time, complexity, or environment pressure.',
  'Combine the skill with another path in a practical project.',
  'Solve an unfamiliar problem without step-by-step guidance.',
  'Teach the skill, diagnose mistakes, and produce a polished result.',
  'Demonstrate reliable mastery and define a tiny maintenance routine.'
]

export const atlasSkills: AtlasSkill[] = atlasPaths.flatMap((path) =>
  path.skills.map((name, index) => {
    const tier = index + 1
    const id = `${path.id}-S${String(tier).padStart(2, '0')}`
    return {
      id,
      domainId: path.domainId,
      domain: path.domain,
      pathId: path.id,
      path: path.name,
      tier,
      name,
      description: `Develop ${name.toLowerCase()} as a practical step toward this path goal: ${path.goal}.`,
      proof: PROOFS[tier],
      estimatedHours: HOURS[tier],
      maintenanceMinutesPerMonth: MAINTENANCE[tier],
      power: POWER[tier],
      synergy: SYNERGY[tier],
      prerequisiteIds: tier === 1 ? [] : [`${path.id}-S${String(tier - 1).padStart(2, '0')}`],
      goldenPath: GOLDEN_PATHS.has(path.id) && tier <= 5
    }
  })
)

export const skillById = new Map(atlasSkills.map((skill) => [skill.id, skill]))
export const pathById = new Map(atlasPaths.map((path) => [path.id, path]))
export const domainById = new Map(atlasDomains.map((domain) => [domain.id, domain]))
export const goldenPathSkills = atlasSkills.filter((skill) => skill.goldenPath)

export function rankLabel(rank: number) {
  return RANKS[Math.max(0, Math.min(RANKS.length - 1, rank))]
}

export function xpForRank(rank: number) {
  return [0, 20, 60, 140, 280, 500][Math.max(0, Math.min(5, rank))]
}

export function totalXp(progress: Record<string, number>, bonusXp = 0) {
  return Object.values(progress).reduce((sum, rank) => sum + xpForRank(rank), bonusXp)
}

export function levelFromXp(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1
}
