import type { Node, NodeProps } from '@xyflow/react'
import type { SkillCategory } from '../types'

type SectionNodeData = {
  title: string
  subtitle: string
  category: SkillCategory
  skillCount: number
}

export type SectionFlowNode = Node<SectionNodeData, 'section'>

export function SectionNode({ data }: NodeProps<SectionFlowNode>) {
  return (
    <section className={`tree-section tree-section--${data.category}`}>
      <header className="tree-section__header">
        <div>
          <span>{data.subtitle}</span>
          <h2>{data.title}</h2>
        </div>
        <strong>{data.skillCount}</strong>
      </header>
    </section>
  )
}
