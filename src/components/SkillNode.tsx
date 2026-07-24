import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
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
  return (
    <div
      className={`skill-node skill-node--${data.category} ${selected ? 'is-selected' : ''} ${data.matched ? 'is-match' : ''}`}
      aria-label={`${data.label}, ${data.difficulty}`}
    >
      <Handle type="target" position={Position.Top} className="skill-handle" />
      <span className="skill-node__category">{categoryLabels[data.category]}</span>
      <strong>{data.label}</strong>
      <div className="skill-node__footer">
        <span>{data.difficulty}</span>
        {data.analyzer ? <span className="analyzer-dot" title="Form checker supported">● Form</span> : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="skill-handle" />
    </div>
  )
}
