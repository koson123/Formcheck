import { useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type NodeMouseHandler
} from '@xyflow/react'
import { Search, Video, X } from 'lucide-react'
import { skillById, skillLinks, skills } from '../data/skills'
import type { ExerciseId, Skill, SkillCategory } from '../types'
import { SkillNode, type SkillFlowNode } from './SkillNode'

const nodeTypes = { skill: SkillNode }

const branchColors: Record<SkillCategory, string> = {
  foundation: '#94a3b8',
  push: '#fb7185',
  pull: '#60a5fa',
  balance: '#c084fc',
  core: '#fbbf24',
  legs: '#4ade80',
  mobility: '#2dd4bf'
}

type Props = {
  onAnalyze: (exercise: ExerciseId) => void
}

export function SkillTree({ onAnalyze }: Props) {
  const [query, setQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const normalizedQuery = query.trim().toLowerCase()

  const nodes = useMemo<SkillFlowNode[]>(() => skills.map((skill) => ({
    id: skill.id,
    type: 'skill',
    position: { x: skill.x, y: skill.y },
    draggable: false,
    selectable: true,
    data: {
      label: skill.name,
      category: skill.category,
      difficulty: skill.difficulty,
      analyzer: Boolean(skill.analyzerExercise),
      matched: Boolean(normalizedQuery && (
        skill.name.toLowerCase().includes(normalizedQuery) ||
        skill.category.includes(normalizedQuery) ||
        skill.difficulty.toLowerCase().includes(normalizedQuery)
      ))
    }
  })), [normalizedQuery])

  const edges = useMemo<Edge[]>(() => skillLinks.map((link, index) => {
    const source = skillById.get(link.source)
    return {
      id: `${link.source}-${link.target}-${index}`,
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: { stroke: source ? branchColors[source.category] : '#64748b', strokeWidth: 1.5, opacity: 0.55 }
    }
  }), [])

  const onNodeClick: NodeMouseHandler<SkillFlowNode> = (_, node) => {
    setSelectedSkill(skillById.get(node.id) ?? null)
  }

  return (
    <section className="workspace tree-workspace">
      <header className="workspace-header">
        <div>
          <span className="eyebrow">Calisthenics roadmap</span>
          <h1>Explore the skill tree</h1>
          <p>Drag to move, scroll to zoom, and select any skill to see its prerequisites and technique notes.</p>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a skill or branch" />
          {query ? <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button> : null}
        </label>
      </header>

      <div className="tree-stage">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.25}
          maxZoom={1.6}
          nodesConnectable={false}
          elementsSelectable
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#243348" />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => branchColors[(node.data?.category as SkillCategory) ?? 'foundation']}
            maskColor="rgba(2, 8, 23, 0.72)"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {selectedSkill ? (
        <aside className="skill-detail" aria-label={`${selectedSkill.name} details`}>
          <button className="icon-button skill-detail__close" onClick={() => setSelectedSkill(null)} aria-label="Close details">
            <X size={20} />
          </button>
          <span className={`branch-chip branch-chip--${selectedSkill.category}`}>{selectedSkill.category}</span>
          <h2>{selectedSkill.name}</h2>
          <div className="detail-meta">
            <span>{selectedSkill.difficulty}</span>
            <span>{selectedSkill.standard}</span>
          </div>
          <p className="detail-summary">{selectedSkill.summary}</p>

          <DetailList title="Prerequisites" items={selectedSkill.prerequisites.map((id) => skillById.get(id)?.name ?? id)} empty="No prerequisites" />
          <DetailList title="Key cues" items={selectedSkill.cues} />
          <DetailList title="Common mistakes" items={selectedSkill.commonMistakes} warning />
          <DetailList title="Leads to" items={selectedSkill.leadsTo.map((id) => skillById.get(id)?.name ?? id)} empty="End of this branch" />

          {selectedSkill.analyzerExercise ? (
            <button className="primary-button detail-analyze" onClick={() => onAnalyze(selectedSkill.analyzerExercise!)}>
              <Video size={18} /> Analyze my form
            </button>
          ) : (
            <p className="muted-note">A form template for this skill can be added later without changing the tree.</p>
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
