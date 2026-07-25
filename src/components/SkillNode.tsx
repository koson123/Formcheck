import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Video } from 'lucide-react'
import type { Difficulty, SkillCategory, SkillProgressStatus } from '../types'

type SkillNodeData = {
  label: string
  skillId: string
  category: SkillCategory
  difficulty: Difficulty
  analyzer: boolean
  matched: boolean
  dimmed: boolean
  pathActive: boolean
  status: SkillProgressStatus
}

export type SkillFlowNode = Node<SkillNodeData, 'skill'>

export function SkillNode({ data, selected }: NodeProps<SkillFlowNode>) {
  return (
    <div
      className={[
        'skill-node',
        'organic-skill-node',
        `organic-skill-node--${data.status}`,
        selected ? 'is-selected' : '',
        data.matched ? 'is-match' : '',
        data.dimmed ? 'is-dimmed' : '',
        data.pathActive ? 'is-path-active' : ''
      ].filter(Boolean).join(' ')}
      aria-label={`${data.label}, ${data.difficulty}, ${statusLabel(data.status)}`}
      title={`${data.label} · ${data.difficulty} · ${statusLabel(data.status)}`}
    >
      <Handle type="target" position={Position.Top} className="skill-handle organic-skill-handle" />
      <div className="organic-skill-node__ring">
        <MovementGlyph skillId={data.skillId} category={data.category} />
      </div>
      {data.analyzer ? (
        <span className="organic-skill-node__form" title="Form checker supported">
          <Video size={10} />
        </span>
      ) : null}
      <span className="organic-skill-node__label">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="skill-handle organic-skill-handle" />
    </div>
  )
}

function statusLabel(status: SkillProgressStatus) {
  if (status === 'in-progress') return 'In progress'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function MovementGlyph({ skillId, category }: { skillId: string; category: SkillCategory }) {
  const glyph = glyphForSkill(skillId, category)

  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <circle cx={glyph.headX} cy={glyph.headY} r="1.45" />
      <path d={glyph.path} />
    </svg>
  )
}

function glyphForSkill(skillId: string, category: SkillCategory) {
  if (skillId.includes('handstand') || skillId === 'press-handstand') {
    return {
      headX: 12,
      headY: 20,
      path: 'M12 18v-7M12 15l-5-5M12 15l5-5M12 11V5M12 5L8 2M12 5l4-3'
    }
  }

  if (skillId.includes('planche') || skillId === 'frog-stand') {
    return {
      headX: 4,
      headY: 10,
      path: 'M2 15h20M6 14l5-5 5 2 5 0M11 9l-2 5M16 11l-1 4'
    }
  }

  if (skillId.includes('lever')) {
    return {
      headX: 4,
      headY: 10,
      path: 'M2 4h20M7 4L5 9l5 3h7l5 0M10 12l-3 4M17 12l4 3'
    }
  }

  if (
    skillId.includes('pull-up') ||
    skillId.includes('muscle-up') ||
    skillId === 'active-hang' ||
    skillId === 'scap-pull'
  ) {
    return {
      headX: 12,
      headY: 8,
      path: 'M4 3h16M8 3l4 4 4-4M12 9v6M12 15l-4 6M12 15l4 6'
    }
  }

  if (skillId.includes('lsit') || skillId === 'vsit' || skillId === 'manna') {
    return {
      headX: 8,
      headY: 8,
      path: 'M4 19h16M8 10v7M8 13l-4 4M8 13l5 3M13 16h8'
    }
  }

  if (
    skillId.includes('squat') ||
    skillId.includes('pistol') ||
    skillId.includes('shrimp')
  ) {
    return {
      headX: 12,
      headY: 4,
      path: 'M12 6v6M12 9l-5 3M12 9l5 3M12 12l-5 7M12 12l6 4'
    }
  }

  if (skillId.includes('push-up') || skillId === 'plank') {
    return {
      headX: 4,
      headY: 10,
      path: 'M2 16h20M6 11l5 2 6 0 5 2M11 13l-2 4M17 13l2 4'
    }
  }

  if (skillId.includes('dip')) {
    return {
      headX: 12,
      headY: 5,
      path: 'M4 9v12M20 9v12M12 7v7M12 10L7 9M12 10l5-1M12 14l-4 7M12 14l4 7'
    }
  }

  if (category === 'core' || category === 'mobility' || category === 'foundation') {
    return {
      headX: 5,
      headY: 11,
      path: 'M2 16h20M7 12l5 2 6-1M12 14l-3 4M18 13l3 4'
    }
  }

  return {
    headX: 12,
    headY: 4,
    path: 'M12 6v7M12 9l-5 4M12 9l5 4M12 13l-4 8M12 13l4 8'
  }
}
