import { describe, expect, it } from 'vitest'
import { skills } from './skills'
import { placementBySkillId, treePlacements, treeZones } from './treeLayout'

describe('organic skill map layout', () => {
  it('places every skill exactly once', () => {
    const ids = treePlacements.map((placement) => placement.skillId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.sort()).toEqual(skills.map((skill) => skill.id).sort())
  })

  it('uses only declared movement zones', () => {
    const zones = new Set(treeZones.map((zone) => zone.id))
    for (const placement of treePlacements) {
      expect(zones.has(placement.zone)).toBe(true)
    }
  })

  it('contains every prerequisite used by a mapped skill', () => {
    for (const skill of skills) {
      for (const prerequisite of skill.prerequisites) {
        expect(placementBySkillId.has(prerequisite)).toBe(true)
      }
    }
  })
})
