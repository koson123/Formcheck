import { useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type NodeMouseHandler
} from '@xyflow/react'
import { Search, Video, X } from 'lucide-react'
import { skillById, skillLinks } from '../data/skills'
import { treeSections } from '../data/treeLayout'
import type { Difficulty, ExerciseId, Skill, SkillCategory } from '../types'
import { SectionNode, type SectionFlowNode } from './SectionNode'
import { SkillNode, type SkillFlowNode } from './SkillNode'

const nodeTypes = { skill: SkillNode, section: SectionNode }

const branchColors: Record<SkillCategory, string> = {
  foundation: '#9ee6c1',
  push: '#f3a6b8',
  pull: '#98c7ff',
  balance: '#d2b4ff',
  core: '#f8d778',
  legs: '#9ee7a9',
  mobility: '#86dfd5'
}

const difficultyColors: Record<Difficulty, string> = {
  Foundation: '#9ee6c1',
  Beginner: '#a8d8ff',
  Intermediate: '#d2b4ff',
  Advanced: '#f3a6b8',
  Elite: '#f8d778'
}

const sectionWidth = 236
const sectionGap = 46
const skillHeight = 118
const skillGap = 34
const sectionHeader = 92

type TreeFilter = 'all' | 'push' | 'pull' | 'balance' | 'core' | 'legs'

type Props = {
  onAnalyze: (exercise: ExerciseId) => void
}

export function SkillTree({ onAnalyze }: Props) {
  const [query, setQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [filter, setFilter] = useState<TreeFilter>('all')
  const normalizedQuery = query.trim().toLowerCase()

  const visibleSections = useMemo(() => {
    if (filter === 'all') return treeSections
    return treeSections.filter((section) => section.category === filter || section.id === 'foundations')
  }, [filter])

  const visibleSkillIds = useMemo(
    () => new Set(visibleSections.flatMap((section) => section.skillIds)),
    [visibleSections]
  )

  const nodes = useMemo<Array<SectionFlowNode | SkillFlowNode>>(() => {
    const sectionNodes: SectionFlowNode[] = []
    const skillNodes: SkillFlowNode[] = []

    visibleSections.forEach((section, sectionIndex) => {
      const sectionHeight = sectionHeader + section.skillIds.length * (skillHeight + skillGap) + 22
      sectionNodes.push({
        id: `section-${section.id}`,
        type: 'section',
        position: { x: sectionIndex * (sectionWidth + sectionGap), y: 0 },
        draggable: false,
        selectable: false,
        data: {
          title: section.title,
          subtitle: section.subtitle,
          category: section.category,
          skillCount: section.skillIds.length
        },
        style: { width: sectionWidth, height: sectionHeight },
        zIndex: -1
      })

      section.skillIds.forEach((skillId, skillIndex) => {
        const skill = skillById.get(skillId)
        if (!skill) return
        const matched = Boolean(normalizedQuery && (
          skill.name.toLowerCase().includes(normalizedQuery) ||
          skill.category.includes(normalizedQuery) ||
          skill.difficulty.toLowerCase().includes(normalizedQuery) ||
          section.title.toLowerCase().includes(normalizedQuery)
        ))

        skillNodes.push({
          id: skill.id,
          type: 'skill',
          parentId: `section-${section.id}`,
          extent: 'parent',
          position: { x: 26, y: sectionHeader + skillIndex * (skillHeight + skillGap) },
          draggable: false,
          selectable: true,
          data: {
            label: skill.name,
            category: skill.category,
            difficulty: skill.difficulty,
            analyzer: Boolean(skill.analyzerExercise),
            matched
          },
          style: { width: sectionWidth - 52, height: skillHeight },
          zIndex: 2
        })
      })
    })

    return [...sectionNodes, ...skillNodes]
  }, [normalizedQuery, visibleSections])

  const edges = useMemo<Edge[]>(() => skillLinks
    .filter((link) => visibleSkillIds.has(link.source) && visibleSkillIds.has(link.target))
    .map((link, index) => {
      const source = skillById.get(link.source)
      const target = skillById.get(link.target)
      const sameSection = visibleSections.some((section) => section.skillIds.includes(link.source) && section.skillIds.includes(link.target))
      return {
        id: `${link.source}-${link.target}-${index}`,
        source: link.source,
        target: link.target,
        type: sameSection ? 'straight' : 'smoothstep',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        style: {
          stroke: source ? branchColors[source.category] : '#718096',
          strokeWidth: sameSection ? 2.4 : 1.6,
          opacity: sameSection ? 0.8 : 0.48
        },
        zIndex: 1,
        label: source && target && source.category !== target.category ? 'prerequisite' : undefined,
        labelStyle: { fill: '#8090a6', fontSize: 9 },
        labelBgStyle: { fill: '#09111e', fillOpacity: 0.9 }
      }
    }), [visibleSections, visibleSkillIds])

  const onNodeClick: NodeMouseHandler<SkillFlowNode> = (_, node) => {
    setSelectedSkill(skillById.get(node.id) ?? null)
  }

  return (
    <section className="workspace tree-workspace">
      <header className="workspace-header tree-header">
        <div>
          <span className="eyebrow">Calisthenics progression chart</span>
          <h1>Skill roadmap</h1>
          <p>Progressions are grouped into clear paths. Follow each column downward from foundations toward advanced skills.</p>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a skill, difficulty, or path" />
          {query ? <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button> : null}
        </label>
      </header>

      <div className="tree-filter-bar" aria-label="Skill tree branch filter">
        {(['all', 'push', 'pull', 'balance', 'core', 'legs'] as TreeFilter[]).map((branch) => (
          <button key={branch} className={filter === branch ? 'active' : ''} onClick={() => setFilter(branch)}>
            {branch === 'all' ? 'Full chart' : branch}
          </button>
        ))}
      </div>

      <aside className="tree-legend panel">
        <strong>Difficulty</strong>
        {(Object.entries(difficultyColors) as Array<[Difficulty, string]>).map(([difficulty, color]) => (
          <span key={difficulty}><i style={{ background: color }} />{difficulty}</span>
        ))}
        <small>Solid vertical lines are the main progression. Fainter side lines show supporting prerequisites.</small>
      </aside>

      <div className="tree-stage tree-stage--columns">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.14, minZoom: 0.25, maxZoom: 0.72 }}
          minZoom={0.18}
          maxZoom={1.35}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Lines} gap={32} size={0.6} color="#1d2b3c" />
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
