import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Video } from 'lucide-react'
import type { Difficulty, SkillCategory } from '../types'

type SkillNodeData = {
  label: string
  category: SkillCategory
  difficulty: Difficulty
  analyzer: boolean
  matched: boolean
}

export type SkillFlowNode = Node<SkillNodeData, 'skill'>

const categoryLabels: Record<SkillCategory, string> = {
  foundation: 'Foundation',
  push: 'Push',
  pull: 'Pull',
  balance: 'Balance',
  core: 'Core',
  legs: 'Legs',
  mobility: 'Mobility'
}

export function SkillNode({ data, selected }: NodeProps<SkillFlowNode>) {
  const difficultyClass = data.difficulty.toLowerCase()

  return (
    <div
      className={`skill-node skill-node--${data.category} skill-node--${difficultyClass} ${selected ? 'is-selected' : ''} ${data.matched ? 'is-match' : ''}`}
      aria-label={`${data.label}, ${data.difficulty}`}
    >
      <Handle type="target" position={Position.Top} className="skill-handle" />
      <div className="skill-node__icon" aria-hidden="true">
        <MovementGlyph category={data.category} />
      </div>
      <div className="skill-node__label">
        <strong>{data.label}</strong>
        <span>{categoryLabels[data.category]}</span>
      </div>
      <div className="skill-node__footer">
        <span className="difficulty-chip">{data.difficulty}</span>
        {data.analyzer ? <span className="analyzer-badge" title="Form checker supported"><Video size={12} /> Form</span> : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="skill-handle" />
    </div>
  )
}

function MovementGlyph({ category }: { category: SkillCategory }) {
  const pose = category === 'pull'
    ? 'M6 5h12M9 5l3 5 3-5M12 10v6M12 16l-4 4M12 16l4 4'
    : category === 'balance'
      ? 'M12 3v6M12 6l-5 5M12 6l5 5M12 9v7M12 16l-4 5M12 16l4 5'
      : category === 'legs'
        ? 'M12 4v7M12 7l-5 4M12 7l5 4M12 11l-4 9M12 11l5 8'
        : category === 'core'
          ? 'M4 12h7M11 12l4-5M11 12l5 5M15 7h5M16 17h4'
          : 'M4 15h16M8 15l4-7 4 7M12 8V4'

  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <circle cx="12" cy="3" r="1.5" />
      <path d={pose} />
    </svg>
  )
}
