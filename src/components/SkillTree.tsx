import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge
} from '@xyflow/react'
import { RotateCcw, Search, Video, X } from 'lucide-react'
import { skillById, skillLinks } from '../data/skills'
import {
  placementBySkillId,
  rootSkillIds,
  treePlacements,
  treeZones,
  type TreeZoneId
} from '../data/treeLayout'
import type { ExerciseId, Skill, SkillProgressStatus } from '../types'
import { SectionNode, type SectionFlowNode } from './SectionNode'
import { SkillNode, type SkillFlowNode } from './SkillNode'

const nodeTypes = { skill: SkillNode, section: SectionNode }
type TreeFlowNode = SectionFlowNode | SkillFlowNode
type TreeFilter = 'all' | TreeZoneId
type StoredProgress = Partial<Record<string, 'in-progress' | 'mastered'>>

const STORAGE_KEY = 'formcheck-skill-progress-v1'

const statusColors: Record<SkillProgressStatus, string> = {
  locked: '#4b5563',
  unlocked: '#e2e8f0',
  'in-progress': '#c084fc',
  mastered: '#67e8f9'
}

const filterLabels: Record<TreeFilter, string> = {
  all: 'Full map',
  'horizontal-push': 'Horizontal push',
  'vertical-push': 'Vertical push',
  'horizontal-pull': 'Horizontal pull',
  'vertical-pull': 'Vertical pull',
  core: 'Core',
  legs: 'Legs'
}

type Props = {
  onAnalyze: (exercise: ExerciseId) => void
}

export function SkillTree({ onAnalyze }: Props) {
  const [query, setQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [filter, setFilter] = useState<TreeFilter>('all')
  const [progress, setProgress] = useState<StoredProgress>(loadProgress)
  const normalizedQuery = query.trim().toLowerCase()

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  const statusBySkillId = useMemo(() => {
    const statuses = new Map<string, SkillProgressStatus>()

    for (const placement of treePlacements) {
      const recorded = progress[placement.skillId]
      const skill = skillById.get(placement.skillId)

      if (recorded) {
        statuses.set(placement.skillId, recorded)
        continue
      }

      if (!skill || rootSkillIds.has(placement.skillId) || skill.prerequisites.length === 0) {
        statuses.set(placement.skillId, 'unlocked')
        continue
      }

      const prerequisitesMastered = skill.prerequisites.every(
        (prerequisiteId) => progress[prerequisiteId] === 'mastered'
      )
      statuses.set(placement.skillId, prerequisitesMastered ? 'unlocked' : 'locked')
    }

    return statuses
  }, [progress])

  const filterFocusIds = useMemo(() => {
    if (filter === 'all') return new Set(treePlacements.map((placement) => placement.skillId))

    const focused = new Set(
      treePlacements
        .filter((placement) => placement.zone === filter)
        .map((placement) => placement.skillId)
    )

    const addPrerequisites = (skillId: string) => {
      const skill = skillById.get(skillId)
      if (!skill) return
      for (const prerequisite of skill.prerequisites) {
        if (focused.has(prerequisite)) continue
        focused.add(prerequisite)
        addPrerequisites(prerequisite)
      }
    }

    for (const skillId of [...focused]) addPrerequisites(skillId)
    return focused
  }, [filter])

  const selectedPathIds = useMemo(() => {
    if (!selectedSkill) return new Set<string>()
    const path = new Set<string>([selectedSkill.id])

    const addAncestors = (skillId: string) => {
      const skill = skillById.get(skillId)
      if (!skill) return
      for (const prerequisite of skill.prerequisites) {
        if (path.has(prerequisite)) continue
        path.add(prerequisite)
        addAncestors(prerequisite)
      }
    }

    const addDescendants = (skillId: string) => {
      for (const link of skillLinks) {
        if (link.source !== skillId || path.has(link.target)) continue
        path.add(link.target)
        addDescendants(link.target)
      }
    }

    addAncestors(selectedSkill.id)
    addDescendants(selectedSkill.id)
    return path
  }, [selectedSkill])

  const nodes = useMemo<TreeFlowNode[]>(() => {
    const zoneNodes: SectionFlowNode[] = treeZones.map((zone) => ({
      id: `section-${zone.id}`,
      type: 'section',
      position: { x: zone.x, y: zone.y },
      draggable: false,
      selectable: false,
      data: {
        title: zone.title,
        category: zone.category,
        dimmed: filter !== 'all' && filter !== zone.id
      },
      style: { width: 270, height: 48 },
      zIndex: -1
    }))

    const skillNodes: SkillFlowNode[] = treePlacements.flatMap((placement) => {
      const skill = skillById.get(placement.skillId)
      if (!skill) return []

      const matched = Boolean(normalizedQuery && (
        skill.name.toLowerCase().includes(normalizedQuery) ||
        skill.category.includes(normalizedQuery) ||
        skill.difficulty.toLowerCase().includes(normalizedQuery) ||
        filterLabels[placement.zone].toLowerCase().includes(normalizedQuery)
      ))
      const inSelectedPath = selectedSkill ? selectedPathIds.has(skill.id) : false
      const filteredOut = !filterFocusIds.has(skill.id)
      const pathDimmed = Boolean(selectedSkill && !inSelectedPath)

      return [{
        id: skill.id,
        type: 'skill' as const,
        position: { x: placement.x, y: placement.y },
        draggable: false,
        selectable: true,
        data: {
          label: skill.name,
          skillId: skill.id,
          category: skill.category,
          difficulty: skill.difficulty,
          analyzer: Boolean(skill.analyzerExercise),
          matched,
          dimmed: (filteredOut || pathDimmed) && !matched,
          pathActive: inSelectedPath,
          status: statusBySkillId.get(skill.id) ?? 'locked'
        },
        style: { width: 64, height: 64 },
        zIndex: 3
      }]
    })

    return [...zoneNodes, ...skillNodes]
  }, [filter, filterFocusIds, normalizedQuery, selectedPathIds, selectedSkill, statusBySkillId])

  const edges = useMemo<Edge[]>(() => skillLinks
    .filter((link) => placementBySkillId.has(link.source) && placementBySkillId.has(link.target))
    .map((link, index) => {
      const sourcePlacement = placementBySkillId.get(link.source)!
      const targetPlacement = placementBySkillId.get(link.target)!
      const sameZone = sourcePlacement.zone === targetPlacement.zone
      const selectedPathEdge = Boolean(
        selectedSkill && selectedPathIds.has(link.source) && selectedPathIds.has(link.target)
      )
      const filterEdge = filterFocusIds.has(link.source) && filterFocusIds.has(link.target)
      const targetStatus = statusBySkillId.get(link.target) ?? 'locked'
      const stroke = selectedPathEdge ? '#f8fafc' : statusColors[targetStatus]
      const opacity = selectedSkill
        ? selectedPathEdge ? 0.95 : 0.05
        : filter === 'all' || filterEdge
          ? sameZone ? 0.68 : 0.28
          : 0.04

      return {
        id: `${link.source}-${link.target}-${index}`,
        source: link.source,
        target: link.target,
        type: sameZone ? 'straight' : 'smoothstep',
        animated: targetStatus === 'in-progress' && opacity > 0.2,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: selectedPathEdge ? 12 : 9,
          height: selectedPathEdge ? 12 : 9,
          color: stroke
        },
        style: {
          stroke,
          strokeWidth: selectedPathEdge ? 2.2 : sameZone ? 1.35 : 0.9,
          opacity
        },
        zIndex: selectedPathEdge ? 2 : 1
      }
    }), [filter, filterFocusIds, selectedPathIds, selectedSkill, statusBySkillId])

  const selectedStatus = selectedSkill
    ? statusBySkillId.get(selectedSkill.id) ?? 'locked'
    : null

  function updateProgress(skillId: string, value: 'not-started' | 'in-progress' | 'mastered') {
    setProgress((current) => {
      const next = { ...current }
      if (value === 'not-started') delete next[skillId]
      else next[skillId] = value
      return next
    })
  }

  function resetProgress() {
    setProgress({})
  }

  return (
    <section className="workspace tree-workspace organic-tree-workspace">
      <header className="workspace-header tree-header organic-tree-header">
        <div>
          <span className="eyebrow">Calisthenics movement map</span>
          <h1>Skill tree</h1>
          <p>Follow the arrows from foundational control toward advanced skills. Select a node to reveal its full path.</p>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a skill or movement family" />
          {query ? <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button> : null}
        </label>
      </header>

      <div className="tree-filter-bar organic-tree-filter" aria-label="Movement family filter">
        {(Object.keys(filterLabels) as TreeFilter[]).map((branch) => (
          <button key={branch} className={filter === branch ? 'active' : ''} onClick={() => setFilter(branch)}>
            {filterLabels[branch]}
          </button>
        ))}
      </div>

      <aside className="tree-legend organic-tree-legend panel">
        <strong>Progress</strong>
        <span><i style={{ background: statusColors.locked }} />Locked</span>
        <span><i style={{ background: statusColors.unlocked }} />Unlocked</span>
        <span><i style={{ background: statusColors['in-progress'] }} />In progress</span>
        <span><i style={{ background: statusColors.mastered }} />Mastered</span>
        <small>Master prerequisites to unlock the next movement. Progress stays on this computer.</small>
        {Object.keys(progress).length ? (
          <button className="tree-reset-button" onClick={resetProgress}><RotateCcw size={13} /> Reset progress</button>
        ) : null}
      </aside>

      <div className="tree-stage organic-tree-stage">
        <ReactFlow<TreeFlowNode>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            if (node.type !== 'skill') return
            setSelectedSkill(skillById.get(node.id) ?? null)
          }}
          onPaneClick={() => setSelectedSkill(null)}
          fitView
          fitViewOptions={{ padding: 0.1, minZoom: 0.28, maxZoom: 0.64 }}
          minZoom={0.2}
          maxZoom={1.45}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={36} size={0.55} color="#1e293b" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {selectedSkill ? (
        <aside className="skill-detail organic-skill-detail" aria-label={`${selectedSkill.name} details`}>
          <button className="icon-button skill-detail__close" onClick={() => setSelectedSkill(null)} aria-label="Close details">
            <X size={20} />
          </button>
          <div className="organic-detail-heading">
            <span className={`progress-status progress-status--${selectedStatus}`}>{formatStatus(selectedStatus!)}</span>
            <span className={`branch-chip branch-chip--${selectedSkill.category}`}>{selectedSkill.category}</span>
          </div>
          <h2>{selectedSkill.name}</h2>
          <div className="detail-meta">
            <span>{selectedSkill.difficulty}</span>
            <span>{selectedSkill.standard}</span>
          </div>
          <p className="detail-summary">{selectedSkill.summary}</p>

          <div className="tree-progress-control detail-block">
            <h3>Your progress</h3>
            <p>Marking a skill mastered can unlock movements that depend on it.</p>
            <div>
              <button
                className={selectedStatus === 'locked' || selectedStatus === 'unlocked' ? 'active' : ''}
                onClick={() => updateProgress(selectedSkill.id, 'not-started')}
              >Not started</button>
              <button
                className={selectedStatus === 'in-progress' ? 'active' : ''}
                onClick={() => updateProgress(selectedSkill.id, 'in-progress')}
              >In progress</button>
              <button
                className={selectedStatus === 'mastered' ? 'active' : ''}
                onClick={() => updateProgress(selectedSkill.id, 'mastered')}
              >Mastered</button>
            </div>
          </div>

          <DetailList title="Prerequisites" items={selectedSkill.prerequisites.map((id) => skillById.get(id)?.name ?? id)} empty="No prerequisites" />
          <DetailList title="Key cues" items={selectedSkill.cues} />
          <DetailList title="Common mistakes" items={selectedSkill.commonMistakes} warning />
          <DetailList title="Leads to" items={selectedSkill.leadsTo.map((id) => skillById.get(id)?.name ?? id)} empty="End of this branch" />

          {selectedSkill.analyzerExercise ? (
            <button className="primary-button detail-analyze" onClick={() => onAnalyze(selectedSkill.analyzerExercise!)}>
              <Video size={18} /> Analyze my form
            </button>
          ) : (
            <p className="muted-note">A form template for this skill can be added later without changing the map.</p>
          )}
        </aside>
      ) : null}
    </section>
  )
}

function DetailList({ title, items, empty, warning = false }: { title: string; items: string[]; empty?: string; warning?: boolean }) {
  return (
    <div className="detail-block">
      <h3>{title}</h3>
      {items.length ? (
        <ul className={warning ? 'warning-list' : ''}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : <p>{empty}</p>}
    </div>
  )
}

function loadProgress(): StoredProgress {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as StoredProgress : {}
  } catch {
    return {}
  }
}

function formatStatus(status: SkillProgressStatus) {
  if (status === 'in-progress') return 'In progress'
  return status.charAt(0).toUpperCase() + status.slice(1)
}
