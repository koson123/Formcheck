import fs from 'node:fs'

const appPath = 'src/AtlasApp.tsx'
const cssPath = 'src/atlas.css'
const packagePath = 'package.json'
const tauriPath = 'src-tauri/tauri.conf.json'
const cargoPath = 'src-tauri/Cargo.toml'
const atlasDataPath = 'src/data/atlas/index.ts'

let app = fs.readFileSync(appPath, 'utf8')
if (app.includes("superhuman-atlas-progress-v2")) {
  console.log('Retention patch already applied.')
  process.exit(0)
}

function replaceRequired(pattern, replacement, label) {
  const next = app.replace(pattern, replacement)
  if (next === app) throw new Error(`Could not apply patch: ${label}`)
  app = next
}

replaceRequired(
  /import \{ useEffect, useMemo, useState, type CSSProperties \} from 'react'/,
  "import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'",
  'React ChangeEvent import'
)

replaceRequired(
  /type AtlasProgress = \{\s*ranks: Record<string, number>\s*activeSkillIds: string\[\]\s*notes: Record<string, string>\s*completedQuests: Record<string, boolean>\s*bonusXp: number\s*\}/,
  `type MaintenanceRecord = {\n  lastReviewedAt: string\n  refreshCount: number\n}\n\ntype AtlasProgress = {\n  ranks: Record<string, number>\n  activeSkillIds: string[]\n  notes: Record<string, string>\n  maintenance: Record<string, MaintenanceRecord>\n  completedQuests: Record<string, boolean>\n  bonusXp: number\n}`,
  'AtlasProgress maintenance data'
)

replaceRequired(
  /type Quest = \{\s*id: string\s*title: string\s*detail: string\s*xp: number\s*kind: 'daily' \| 'weekly'\s*skillId\?: string\s*\}/,
  `type Quest = {\n  id: string\n  title: string\n  detail: string\n  xp: number\n  kind: 'daily' | 'weekly'\n  skillId?: string\n  maintenanceSkillIds?: string[]\n}\n\ntype RetentionInfo = {\n  skill: AtlasSkill\n  status: 'fresh' | 'due-soon' | 'due'\n  lastReviewedAt: Date\n  dueAt: Date\n  daysRemaining: number\n  intervalDays: number\n}`,
  'Quest and retention types'
)

replaceRequired(
  /const STORAGE_KEY = 'superhuman-atlas-progress-v1'/,
  `const STORAGE_KEY = 'superhuman-atlas-progress-v2'\nconst LEGACY_STORAGE_KEY = 'superhuman-atlas-progress-v1'`,
  'storage migration key'
)

replaceRequired(
  /  function updateSkillRank\(skillId: string, rank: number\) \{[\s\S]*?\n  function updateNote\(skillId: string, note: string\) \{/,
  `  function updateSkillRank(skillId: string, rank: number) {\n    setProgress((current) => {\n      const skill = skillById.get(skillId)\n      const nextRank = Math.max(0, Math.min(5, rank))\n      if (!skill || (nextRank > 0 && !isSkillUnlocked(skill, current.ranks))) return current\n\n      const ranks = { ...current.ranks, [skillId]: nextRank }\n      const maintenance = { ...current.maintenance }\n      if (nextRank >= 3 && !maintenance[skillId]) {\n        maintenance[skillId] = { lastReviewedAt: new Date().toISOString(), refreshCount: 0 }\n      }\n      if (nextRank < 3) delete maintenance[skillId]\n\n      return {\n        ...current,\n        ranks,\n        maintenance,\n        activeSkillIds: sanitizeActiveSkillIds(current.activeSkillIds, ranks)\n      }\n    })\n  }\n\n  function toggleActiveSkill(skillId: string) {\n    setProgress((current) => {\n      const skill = skillById.get(skillId)\n      const isActive = current.activeSkillIds.includes(skillId)\n      if (isActive) {\n        return { ...current, activeSkillIds: current.activeSkillIds.filter((id) => id !== skillId) }\n      }\n      if (!skill || !isSkillUnlocked(skill, current.ranks)) return current\n\n      const activeSkillIds = current.activeSkillIds.length < 3\n        ? [...current.activeSkillIds, skillId]\n        : [...current.activeSkillIds.slice(1), skillId]\n      return { ...current, activeSkillIds }\n    })\n  }\n\n  function refreshSkill(skillId: string) {\n    setProgress((current) => {\n      if ((current.ranks[skillId] ?? 0) < 3) return current\n      const previous = current.maintenance[skillId]\n      return {\n        ...current,\n        maintenance: {\n          ...current.maintenance,\n          [skillId]: {\n            lastReviewedAt: new Date().toISOString(),\n            refreshCount: (previous?.refreshCount ?? 0) + 1\n          }\n        }\n      }\n    })\n  }\n\n  function updateNote(skillId: string, note: string) {`,
  'rank, active lock, and refresh actions'
)

replaceRequired(
  /  function completeQuest\(quest: Quest\) \{[\s\S]*?\n  \}\n\n  function openMovement/,
  `  function completeQuest(quest: Quest) {\n    if (progress.completedQuests[quest.id]) return\n    setProgress((current) => {\n      const maintenance = { ...current.maintenance }\n      for (const skillId of quest.maintenanceSkillIds ?? []) {\n        if ((current.ranks[skillId] ?? 0) < 3) continue\n        const previous = maintenance[skillId]\n        maintenance[skillId] = {\n          lastReviewedAt: new Date().toISOString(),\n          refreshCount: (previous?.refreshCount ?? 0) + 1\n        }\n      }\n      return {\n        ...current,\n        maintenance,\n        completedQuests: { ...current.completedQuests, [quest.id]: true },\n        bonusXp: current.bonusXp + quest.xp\n      }\n    })\n  }\n\n  function openMovement`,
  'quest maintenance completion'
)

replaceRequired(
  /onCompleteQuest=\{completeQuest\}\s*\/>/,
  `onCompleteQuest={completeQuest}\n            onRefreshSkill={refreshSkill}\n          />`,
  'command center refresh callback'
)

let callbackInsertions = 0
app = app.replace(/onNoteChange=\{updateNote\}\s*onOpenMovement=\{openMovement\}/g, () => {
  callbackInsertions += 1
  return `onNoteChange={updateNote}\n            onRefreshSkill={refreshSkill}\n            onOpenMovement={openMovement}`
})
if (callbackInsertions < 2) throw new Error('Could not wire both skill-page refresh callbacks')

replaceRequired(
  /function CommandCenter\([\s\S]*?\}\) \{/,
  `function CommandCenter({ progress, xp, level, onOpenAtlas, onOpenSkill, onCompleteQuest, onRefreshSkill }: {\n  progress: AtlasProgress\n  xp: number\n  level: number\n  onOpenAtlas: () => void\n  onOpenSkill: (skillId: string) => void\n  onCompleteQuest: (quest: Quest) => void\n  onRefreshSkill: (skillId: string) => void\n}) {`,
  'CommandCenter props'
)

replaceRequired(
  /  const quests = buildQuests\(progress\)\.filter\(\(quest\) => quest\.kind === 'daily'\)\.slice\(0, 3\)/,
  `  const quests = buildQuests(progress).filter((quest) => quest.kind === 'daily').slice(0, 3)\n  const retentionQueue = getMaintenanceQueue(progress, 4)`,
  'dashboard retention queue'
)

replaceRequired(
  /        <section className="atlas-panel atlas-domain-panel">/,
  `        <section className="atlas-panel atlas-retention-panel">\n          <PanelHeading eyebrow="Retention system" title="Capability upkeep" />\n          {retentionQueue.length ? (\n            <div className="atlas-retention-list">\n              {retentionQueue.map((item) => (\n                <article key={item.skill.id} className={\`retention-\${item.status}\`}>\n                  <button className="atlas-retention-open" onClick={() => onOpenSkill(item.skill.id)}>\n                    <RankOrb skill={item.skill} rank={progress.ranks[item.skill.id] ?? 0} small />\n                    <span><strong>{item.skill.name}</strong><small>{retentionLabel(item)}</small></span>\n                  </button>\n                  <button className="atlas-retention-refresh" onClick={() => onRefreshSkill(item.skill.id)}><RotateCcw size={14} /> Refreshed</button>\n                </article>\n              ))}\n            </div>\n          ) : (\n            <EmptyState icon={ShieldCheck} title="Nothing due" detail="Reliable skills will appear here when a short refresh is needed." action="Review learned skills" onAction={onOpenAtlas} />\n          )}\n        </section>\n\n        <section className="atlas-panel atlas-domain-panel">`,
  'dashboard retention panel'
)

replaceRequired(
  /function AtlasExplorer\([\s\S]*?\}: SkillActions & \{ progress: AtlasProgress \}\) \{/,
  `function AtlasExplorer({ progress, onRankChange, onToggleActive, onNoteChange, onRefreshSkill, onOpenMovement }: SkillActions & { progress: AtlasProgress }) {`,
  'AtlasExplorer refresh prop'
)

let drawerCalls = 0
app = app.replace(/onNoteChange=\{onNoteChange\}\s*onOpenMovement=\{onOpenMovement\}/g, () => {
  drawerCalls += 1
  return `onNoteChange={onNoteChange} onRefreshSkill={onRefreshSkill} onOpenMovement={onOpenMovement}`
})
if (drawerCalls < 2) throw new Error('Could not wire both SkillDrawer refresh callbacks')

replaceRequired(
  /function GoldenPath\([\s\S]*?\}: SkillActions & \{ progress: AtlasProgress \}\) \{/,
  `function GoldenPath({ progress, onRankChange, onToggleActive, onNoteChange, onRefreshSkill, onOpenMovement }: SkillActions & { progress: AtlasProgress }) {`,
  'GoldenPath refresh prop'
)

replaceRequired(
  /type SkillActions = \{\s*onRankChange: \(skillId: string, rank: number\) => void\s*onToggleActive: \(skillId: string\) => void\s*onNoteChange: \(skillId: string, note: string\) => void\s*onOpenMovement: \(exercise\?: ExerciseId\) => void\s*\}/,
  `type SkillActions = {\n  onRankChange: (skillId: string, rank: number) => void\n  onToggleActive: (skillId: string) => void\n  onNoteChange: (skillId: string, note: string) => void\n  onRefreshSkill: (skillId: string) => void\n  onOpenMovement: (exercise?: ExerciseId) => void\n}`,
  'SkillActions refresh callback'
)

replaceRequired(
  /function SkillDrawer\([\s\S]*?\}: SkillActions & \{ skill: AtlasSkill; progress: AtlasProgress; onClose: \(\) => void \}\) \{/,
  `function SkillDrawer({ skill, progress, onClose, onRankChange, onToggleActive, onNoteChange, onRefreshSkill, onOpenMovement }: SkillActions & { skill: AtlasSkill; progress: AtlasProgress; onClose: () => void }) {`,
  'SkillDrawer refresh prop'
)

replaceRequired(
  /  const analyzerExercise = analyzerForSkill\(skill\)/,
  `  const analyzerExercise = analyzerForSkill(skill)\n  const retention = getRetentionInfo(skill, progress)`,
  'SkillDrawer retention state'
)

replaceRequired(
  /      <section className="atlas-drawer-section atlas-chain-section">/,
  `      {rank >= 3 && retention ? (\n        <section className={\`atlas-retention-card retention-\${retention.status}\`}>\n          <RotateCcw size={20} />\n          <div>\n            <span className="atlas-eyebrow">Retention plan</span>\n            <h3>{retentionHeadline(retention)}</h3>\n            <p>{retentionDetail(retention, skill)}</p>\n          </div>\n          <button onClick={() => onRefreshSkill(skill.id)}>Log refresh</button>\n        </section>\n      ) : (\n        <section className="atlas-retention-card retention-locked">\n          <ShieldCheck size={20} />\n          <div><span className="atlas-eyebrow">Retention plan</span><h3>Unlocks at Reliable</h3><p>Reach rank 3, then the Atlas will schedule tiny refresh checks so the skill stays usable.</p></div>\n        </section>\n      )}\n\n      <section className="atlas-drawer-section atlas-chain-section">`,
  'SkillDrawer retention card'
)

replaceRequired(
  /      <div className="atlas-drawer-actions">[\s\S]*?<\/div>/,
  `      <div className="atlas-drawer-actions">\n        <button\n          className={active ? 'atlas-secondary-button active' : unlocked ? 'atlas-primary-button' : 'atlas-secondary-button'}\n          disabled={!unlocked && !active}\n          title={!unlocked && !active ? 'Complete the prerequisite before adding this skill to your loadout.' : undefined}\n          onClick={() => onToggleActive(skill.id)}\n        >\n          {unlocked || active ? <Pin size={17} /> : <LockKeyhole size={17} />}\n          {active ? 'Remove from loadout' : unlocked ? 'Make active' : 'Locked — complete prerequisite'}\n        </button>\n        {analyzerExercise ? <button className="atlas-secondary-button" onClick={() => onOpenMovement(analyzerExercise)}><Camera size={17} /> Check form</button> : null}\n      </div>`,
  'locked loadout button'
)

replaceRequired(
  /onChange=\{\(event\) => setQuery\(event\.target\.value\)\}/,
  `onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}`,
  'typed search event'
)
replaceRequired(
  /onChange=\{\(event\) => onNoteChange\(skill\.id, event\.target\.value\)\}/,
  `onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onNoteChange(skill.id, event.target.value)}`,
  'typed note event'
)

replaceRequired(
  /function isSkillUnlocked\(skill: AtlasSkill, ranks: Record<string, number>\) \{\s*return skill\.prerequisiteIds\.length === 0 \|\| skill\.prerequisiteIds\.every\(\(id\) => \(ranks\[id\] \?\? 0\) >= 2\)\s*\}/,
  `function isSkillUnlocked(skill: AtlasSkill, ranks: Record<string, number>) {\n  return skill.prerequisiteIds.length === 0 || skill.prerequisiteIds.every((id) => (ranks[id] ?? 0) >= 2)\n}\n\nfunction sanitizeActiveSkillIds(activeSkillIds: string[], ranks: Record<string, number>) {\n  return activeSkillIds.filter((id, index) => {\n    const skill = skillById.get(id)\n    return Boolean(skill && isSkillUnlocked(skill, ranks) && activeSkillIds.indexOf(id) === index)\n  }).slice(0, 3)\n}\n\nfunction maintenanceIntervalDays(rank: number) {\n  if (rank >= 5) return 60\n  if (rank >= 4) return 30\n  return 14\n}\n\nfunction getRetentionInfo(skill: AtlasSkill, progress: AtlasProgress, now = new Date()): RetentionInfo | null {\n  const rank = progress.ranks[skill.id] ?? 0\n  if (rank < 3) return null\n  const record = progress.maintenance[skill.id]\n  const parsedLastReview = record?.lastReviewedAt ? new Date(record.lastReviewedAt) : now\n  const lastReviewedAt = Number.isNaN(parsedLastReview.getTime()) ? now : parsedLastReview\n  const intervalDays = maintenanceIntervalDays(rank)\n  const dueAt = new Date(lastReviewedAt.getTime() + intervalDays * 86400000)\n  const daysRemaining = Math.ceil((dueAt.getTime() - now.getTime()) / 86400000)\n  const status = daysRemaining <= 0 ? 'due' : daysRemaining <= Math.max(3, Math.ceil(intervalDays * 0.2)) ? 'due-soon' : 'fresh'\n  return { skill, status, lastReviewedAt, dueAt, daysRemaining, intervalDays }\n}\n\nfunction getMaintenanceQueue(progress: AtlasProgress, limit = 1000) {\n  const priority = { due: 0, 'due-soon': 1, fresh: 2 }\n  return atlasSkills\n    .map((skill) => getRetentionInfo(skill, progress))\n    .filter((item): item is RetentionInfo => Boolean(item))\n    .sort((a, b) => priority[a.status] - priority[b.status] || a.dueAt.getTime() - b.dueAt.getTime())\n    .slice(0, limit)\n}\n\nfunction retentionLabel(info: RetentionInfo) {\n  if (info.status === 'due') return \`\${Math.abs(info.daysRemaining)} day\${Math.abs(info.daysRemaining) === 1 ? '' : 's'} overdue\`\n  if (info.status === 'due-soon') return \`Refresh in \${info.daysRemaining} day\${info.daysRemaining === 1 ? '' : 's'}\`\n  return \`Fresh · next check \${formatDate(info.dueAt)}\`\n}\n\nfunction retentionHeadline(info: RetentionInfo) {\n  if (info.status === 'due') return 'Refresh due now'\n  if (info.status === 'due-soon') return 'Refresh coming soon'\n  return 'Capability is fresh'\n}\n\nfunction retentionDetail(info: RetentionInfo, skill: AtlasSkill) {\n  const minutes = Math.max(5, Math.ceil(skill.maintenanceMinutesPerMonth / 2))\n  if (info.status === 'due') return \`Spend about \${minutes} minutes re-demonstrating the skill, then log the refresh. Your achieved rank is never erased.\`\n  return \`Next check: \${formatDate(info.dueAt)}. A short \${minutes}-minute demonstration should keep this ability available.\`\n}\n\nfunction formatDate(date: Date) {\n  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })\n}`,
  'retention helpers'
)

replaceRequired(
  /function buildQuests\(progress: AtlasProgress\): Quest\[\] \{[\s\S]*?\n\}\n\nfunction weekKey/,
  `function buildQuests(progress: AtlasProgress): Quest[] {\n  const today = new Date().toISOString().slice(0, 10)\n  const week = weekKey(new Date())\n  const active = progress.activeSkillIds\n    .map((id) => skillById.get(id))\n    .filter((skill): skill is AtlasSkill => Boolean(skill && isSkillUnlocked(skill, progress.ranks)))\n  const selected = active.length ? active : getRecommendedSkills(progress.ranks, 3)\n  const dueMaintenance = getMaintenanceQueue(progress).filter((item) => item.status !== 'fresh')\n  const daily: Quest[] = dueMaintenance.slice(0, 1).map((item) => ({\n    id: \`\${today}-maintenance-\${item.skill.id}\`,\n    title: \`Refresh \${item.skill.name}\`,\n    detail: \`Re-demonstrate the skill for \${Math.max(5, Math.ceil(item.skill.maintenanceMinutesPerMonth / 2))} minutes and record one thing that still feels automatic—or one part that needs work.\`,\n    xp: 35,\n    kind: 'daily',\n    skillId: item.skill.id,\n    maintenanceSkillIds: [item.skill.id]\n  }))\n  daily.push(...selected.slice(0, 3 - daily.length).map((skill, index) => ({\n    id: \`\${today}-practice-\${skill.id}\`,\n    title: index === 0 ? \`Train \${skill.name}\` : index === 1 ? \`Test \${skill.name}\` : \`Explain \${skill.name}\`,\n    detail: index === 0\n      ? 'Complete one focused 10–25 minute practice session and record what changed.'\n      : index === 1\n        ? \`Attempt the current proof standard: \${skill.proof}\`\n        : 'Explain the idea simply from memory or demonstrate it to another person.',\n    xp: 25 + index * 10,\n    kind: 'daily' as const,\n    skillId: skill.id\n  })))\n  while (daily.length < 3) {\n    const index = daily.length\n    daily.push({ id: \`\${today}-foundation-\${index}\`, title: ['Ten-minute movement reset', 'Twenty-five-minute focus chamber', 'Problem hunter'][index], detail: ['Complete a short mobility, posture, and joint-control routine.', 'Work on one useful task with notifications and distractions removed.', 'Write down one recurring annoyance that could become a project or automation.'][index], xp: 25 + index * 10, kind: 'daily' })\n  }\n  const names = selected.map((skill) => skill.name)\n  const weekly: Quest[] = [\n    {\n      id: \`\${week}-boss-demonstration\`,\n      title: names.length >= 2 ? \`\${names[0]} + \${names[1]} combination trial\` : 'Build a useful proof project',\n      detail: names.length >= 2 ? \`Create one small challenge or project that requires both \${names[0]} and \${names[1]}. Save evidence and one lesson learned.\` : 'Choose one skill, use it in a real task, document the result, and identify the next bottleneck.',\n      xp: 250,\n      kind: 'weekly'\n    },\n    {\n      id: \`\${week}-boss-maintenance\`,\n      title: 'Capability maintenance circuit',\n      detail: dueMaintenance.length\n        ? \`Refresh \${dueMaintenance.slice(0, 3).map((item) => item.skill.name).join(', ')} and record what stayed automatic.\`\n        : 'Revisit three reliable abilities for five minutes each. Confirm what remains reliable and what needs refreshing.',\n      xp: 120,\n      kind: 'weekly',\n      maintenanceSkillIds: dueMaintenance.slice(0, 3).map((item) => item.skill.id)\n    }\n  ]\n  return [...daily, ...weekly]\n}\n\nfunction weekKey`,
  'maintenance-aware quests'
)

replaceRequired(
  /function emptyProgress\(\): AtlasProgress \{\s*return \{ ranks: \{\}, activeSkillIds: \[\], notes: \{\}, completedQuests: \{\}, bonusXp: 0 \}\s*\}\s*\n\s*function loadProgress\(\): AtlasProgress \{[\s\S]*?\n\}/,
  `function emptyProgress(): AtlasProgress {\n  return { ranks: {}, activeSkillIds: [], notes: {}, maintenance: {}, completedQuests: {}, bonusXp: 0 }\n}\n\nfunction loadProgress(): AtlasProgress {\n  try {\n    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)\n    if (!raw) return emptyProgress()\n    const parsed = JSON.parse(raw) as Partial<AtlasProgress>\n    const ranks = parsed.ranks ?? {}\n    const maintenance = { ...(parsed.maintenance ?? {}) }\n    const migratedAt = new Date().toISOString()\n    for (const [skillId, rank] of Object.entries(ranks)) {\n      if (rank >= 3 && !maintenance[skillId]) maintenance[skillId] = { lastReviewedAt: migratedAt, refreshCount: 0 }\n    }\n    return {\n      ranks,\n      activeSkillIds: sanitizeActiveSkillIds(parsed.activeSkillIds ?? [], ranks),\n      notes: parsed.notes ?? {},\n      maintenance,\n      completedQuests: parsed.completedQuests ?? {},\n      bonusXp: parsed.bonusXp ?? 0\n    }\n  } catch {\n    return emptyProgress()\n  }\n}`,
  'progress migration and active-skill cleanup'
)

replaceRequired(
  /<section className="atlas-panel"><Clock size=\{28\} \/><h2>Tiny maintenance<\/h2><p>Once an ability becomes reliable, define the smallest routine that keeps it available\.<\/p><\/section>/,
  `<section className="atlas-panel"><Clock size={28} /><h2>Retention queue</h2><p>Reliable skills receive short refresh checks every 14–60 days. Achievements never disappear; due skills simply ask for a tune-up.</p></section>`,
  'System page retention explanation'
)

fs.writeFileSync(appPath, app)

let css = fs.readFileSync(cssPath, 'utf8')
if (!css.includes('/* Retention system */')) {
  css += `\n\n/* Retention system */\n.atlas-retention-panel{min-width:0}.atlas-retention-list{display:grid;gap:7px}.atlas-retention-list article{display:grid;grid-template-columns:1fr auto;align-items:center;gap:9px;padding:8px;border:1px solid rgba(149,168,200,.11);border-radius:11px;background:rgba(139,158,191,.035)}.atlas-retention-list article.retention-due{border-color:rgba(255,141,161,.25);background:rgba(255,141,161,.045)}.atlas-retention-list article.retention-due-soon{border-color:rgba(248,220,122,.22);background:rgba(248,220,122,.035)}.atlas-retention-open{display:grid;grid-template-columns:38px 1fr;align-items:center;gap:9px;min-width:0;padding:0;border:0;color:inherit;background:transparent;cursor:pointer;text-align:left}.atlas-retention-open>span:nth-child(2){display:grid;gap:3px;min-width:0}.atlas-retention-open strong{overflow:hidden;font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}.atlas-retention-open small{color:#7889a0;font-size:.56rem}.retention-due .atlas-retention-open small{color:#ff9aae}.retention-due-soon .atlas-retention-open small{color:#dec570}.atlas-retention-refresh{display:inline-flex;align-items:center;gap:5px;padding:7px 8px;border:1px solid rgba(121,242,208,.18);border-radius:8px;color:var(--atlas-accent);background:rgba(121,242,208,.055);cursor:pointer;font-size:.56rem;font-weight:800}.atlas-retention-refresh:hover{background:rgba(121,242,208,.1)}.atlas-retention-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;margin-top:16px;padding:12px;border:1px solid rgba(121,242,208,.16);border-radius:12px;background:rgba(121,242,208,.035)}.atlas-retention-card>svg{color:var(--atlas-accent)}.atlas-retention-card h3{margin:5px 0 4px;font-size:.76rem}.atlas-retention-card p{margin:0;color:#8fa0b7;font-size:.62rem;line-height:1.45}.atlas-retention-card>button{padding:7px 9px;border:1px solid rgba(121,242,208,.2);border-radius:8px;color:var(--atlas-accent);background:rgba(121,242,208,.06);cursor:pointer;font-size:.57rem;font-weight:850}.atlas-retention-card.retention-due{border-color:rgba(255,141,161,.24);background:rgba(255,141,161,.045)}.atlas-retention-card.retention-due>svg,.atlas-retention-card.retention-due h3{color:#ff9aae}.atlas-retention-card.retention-due-soon{border-color:rgba(248,220,122,.22);background:rgba(248,220,122,.035)}.atlas-retention-card.retention-due-soon>svg,.atlas-retention-card.retention-due-soon h3{color:#e6ce77}.atlas-retention-card.retention-locked{grid-template-columns:auto 1fr;border-style:dashed;opacity:.78}.atlas-retention-card.retention-locked>svg{color:#74869d}.atlas-drawer-actions button:disabled{cursor:not-allowed;opacity:.48}\n`
  fs.writeFileSync(cssPath, css)
}

for (const [path, from, to] of [
  [packagePath, '"version": "0.1.0"', '"version": "0.1.1"'],
  [tauriPath, '"version": "0.1.0"', '"version": "0.1.1"'],
  [cargoPath, 'version = "0.5.0"', 'version = "0.1.1"'],
  [atlasDataPath, "export const ATLAS_VERSION = '0.1.0'", "export const ATLAS_VERSION = '0.1.1'"]
]) {
  let text = fs.readFileSync(path, 'utf8')
  if (!text.includes(from) && !text.includes(to)) throw new Error(`Version marker missing in ${path}`)
  text = text.replace(from, to)
  fs.writeFileSync(path, text)
}

console.log('Applied retention system, prerequisite lock enforcement, migration, and v0.1.1 version bump.')
