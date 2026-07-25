import type { Node, NodeProps } from '@xyflow/react'
import type { SkillCategory } from '../types'

type SectionNodeData = {
  title: string
  category: SkillCategory
  dimmed: boolean
}

export type SectionFlowNode = Node<SectionNodeData, 'section'>

export function SectionNode({ data }: NodeProps<SectionFlowNode>) {
  return (
    <div className={`tree-zone-label tree-zone-label--${data.category} ${data.dimmed ? 'is-dimmed' : ''}`}>
      {data.title}
    </div>
  )
}
