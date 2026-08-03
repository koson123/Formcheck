import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Compass,
  Cpu,
  Dumbbell,
  Eye,
  Gauge,
  HeartPulse,
  Info,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Map,
  MessageCircle,
  Minus,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Wrench,
  X,
  Zap,
  type LucideIcon
} from 'lucide-react'
import { FormCheck } from './components/FormCheck'
import { SkillTree } from './components/SkillTree'
import {
  ATLAS_VERSION,
  RANKS,
  atlasDomains,
  atlasPaths,
  atlasSkills,
  domainById,
  goldenPathSkills,
  levelFloor,
  levelFromXp,
  nextLevelFloor,
  pathById,
  rankLabel,
  skillById,
  totalXp,
  type AtlasSkill
} from './data/atlas'
import type { ExerciseId } from './types'

type AtlasPage = 'command' | 'atlas' | 'golden' | 'quests' | 'movement' | 'about'
type MovementMode = 'map' | 'analyzer'

type AtlasProgress = {
  ranks: Record<string, number>
  activeSkillIds: string[]
  notes: Record<string, string>
  completedQuests: Record<string, boolean>
  bonusXp: number
}

type Quest = {
  id: string
  title: string
  detail: string
  xp: number
  kind: 'daily' | 'weekly'
  skillId?: string
}

const STORAGE_KEY = 'superhuman-atlas-progress-v1'

const domainIcons: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  swords: Swords,
  brain: Brain,
  eye: Eye,
  'message-circle': MessageCircle,
  cpu: Cpu,
  wrench: Wrench,
  shield: Shield,
  'heart-pulse': HeartPulse,
  sparkles: Sparkles
}

const navItems: Array<{ id: AtlasPage; label: string; detail: string; icon: LucideIcon }> = [
  { id: 'command', label: 'Command center', detail: 'Your current build', icon: LayoutDashboard },
  { id: 'atlas', label: 'Skill atlas', detail: '1,000 skill nodes', icon: Map },
  { id: 'golden', label: 'Golden path', detail: 'Highest-return route', icon: Star },
  { id: 'quests', label: 'Quest board', detail: 'Turn practice into missions', icon: ListChecks },
  { id: 'movement', label: 'Movement lab', detail: 'Formcheck lives here', icon: Activity },
  { id: 'about', label: 'System', detail: 'Rules and local data', icon: Info }
]

export default function AtlasApp() {
  const [page, setPage] = useState<AtlasPage>('command')
  const [progress, setProgress] = useState<AtlasProgress>(loadProgress)
  const [movementMode, setMovementMode] = useState<MovementMode>('map')
  const [movementExercise, setMovementExercise] = useState<ExerciseId>('push-up')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  const xp = totalXp(progress.ranks, progress.bonusXp)
  const level = levelFromXp(xp)
  const levelStart = levelFloor(level)
  const levelEnd = nextLevelFloor(level)
  const levelProgress = Math.min(100, ((xp - levelStart) / Math.max(1, levelEnd - levelStart)) * 100)

  function updateSkillRank(skillId: string, rank: number) {
    setProgress((current) => ({
      ...current,
      ranks: { ...current.ranks, [skillId]: Math.max(0, Math.min(5, rank)) }
    }))
  }

  function toggleActiveSkill(skillId: string) {
    setProgress((current) => {
      const active = current.activeSkillIds.includes(skillId)
        ? current.activeSkillIds.filter((id) => id !== skillId)
        : current.activeSkillIds.length < 3
          ? [...current.activeSkillIds, skillId]
          : [...current.activeSkillIds.slice(1), skillId]
      return { ...current, activeSkillIds: active }
    })
  }

  function updateNote(skillId: string, note: string) {
    setProgress((current) => ({ ...current, notes: { ...current.notes, [skillId]: note } }))
  }

  function completeQuest(quest: Quest) {
    if (progress.completedQuests[quest.id]) return
    setProgress((current) => ({
      ...current,
      completedQuests: { ...current.completedQuests, [quest.id]: true },
      bonusXp: current.bonusXp + quest.xp
    }))
  }

  function openMovement(exercise?: ExerciseId) {
    if (exercise) {
      setMovementExercise(exercise)
      setMovementMode('analyzer')
    }
    setPage('movement')
  }

  return (
    <div className="atlas-shell">
      <aside className="atlas-sidebar">
        <button className="atlas-brand" onClick={() => setPage('command')}>
          <span className="atlas-brand__mark"><Zap size={24} /></span>
          <span><strong>Superhuman Atlas</strong><small>Build the most capable you</small></span>
        </button>

        <nav className="atlas-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}>
                <Icon size={19} />
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              </button>
            )
          })}
        </nav>

        <div className="atlas-level-card">
          <div className="atlas-level-card__heading"><span>Level {level}</span><strong>{xp.toLocaleString()} XP</strong></div>
          <div className="atlas-progress-track"><i style={{ width: `${levelProgress}%` }} /></div>
          <small>{Math.max(0, levelEnd - xp).toLocaleString()} XP to level {level + 1}</small>
        </div>

        <div className="atlas-local-card">
          <ShieldCheck size={20} />
          <span><strong>Offline first</strong><small>Your progress stays on this computer.</small></span>
        </div>
        <span className="atlas-version">Atlas {ATLAS_VERSION} · Formcheck core 0.5</span>
      </aside>

      <main className="atlas-main">
        {page === 'command' ? (
          <CommandCenter
            progress={progress}
            xp={xp}
            level={level}
            onOpenAtlas={() => setPage('atlas')}
            onOpenSkill={(skillId) => {
              setPage('atlas')
              window.setTimeout(() => window.dispatchEvent(new CustomEvent('atlas-open-skill', { detail: skillId })), 0)
            }}
            onCompleteQuest={completeQuest}
          />
        ) : null}
        {page === 'atlas' ? <AtlasExplorer progress={progress} onRankChange={updateSkillRank} onToggleActive={toggleActiveSkill} onNoteChange={updateNote} onOpenMovement={openMovement} /> : null}
        {page === 'golden' ? <GoldenPath progress={progress} onRankChange={updateSkillRank} onToggleActive={toggleActiveSkill} onNoteChange={updateNote} onOpenMovement={openMovement} /> : null}
        {page === 'quests' ? <QuestBoard progress={progress} onCompleteQuest={completeQuest} onOpenAtlas={() => setPage('atlas')} /> : null}
        {page === 'movement' ? (
          <MovementLab mode={movementMode} exercise={movementExercise} onModeChange={setMovementMode} onAnalyze={(exerciseId) => { setMovementExercise(exerciseId); setMovementMode('analyzer') }} />
        ) : null}
        {page === 'about' ? <SystemPage progress={progress} onReset={() => setProgress(emptyProgress())} /> : null}
      </main>
    </div>
  )
}

function CommandCenter({ progress, xp, level, onOpenAtlas, onOpenSkill, onCompleteQuest }: {
  progress: AtlasProgress
  xp: number
  level: number
  onOpenAtlas: () => void
  onOpenSkill: (skillId: string) => void
  onCompleteQuest: (quest: Quest) => void
}) {
  const stats = useMemo(() => {
    const ranks = Object.values(progress.ranks)
    return {
      discovered: ranks.filter((rank) => rank >= 1).length,
      reliable: ranks.filter((rank) => rank >= 3).length,
      mastered: ranks.filter((rank) => rank >= 5).length,
      goldenReliable: goldenPathSkills.filter((skill) => (progress.ranks[skill.id] ?? 0) >= 3).length
    }
  }, [progress.ranks])
  const activeSkills = progress.activeSkillIds.map((id) => skillById.get(id)).filter(Boolean) as AtlasSkill[]
  const recommended = getRecommendedSkills(progress.ranks, 4)
  const quests = buildQuests(progress).filter((quest) => quest.kind === 'daily').slice(0, 3)

  return (
    <div className="atlas-page atlas-dashboard-page">
      <header className="atlas-page-header">
        <div><span className="atlas-eyebrow">Techno-Ranger build</span><h1>Command center</h1><p>Train a few high-impact abilities at a time. The other 997 skills can wait until they become useful.</p></div>
        <button className="atlas-primary-button" onClick={onOpenAtlas}><Map size={18} /> Explore the atlas</button>
      </header>

      <section className="atlas-hero-card">
        <div><span className="atlas-eyebrow">Current power level</span><strong>Level {level}</strong><p>{xp.toLocaleString()} total XP earned through demonstrated progress and completed quests.</p></div>
        <div className="atlas-hero-orbit" aria-hidden="true"><Zap /><span>{level}</span></div>
        <div className="atlas-stat-strip">
          <Stat label="Discovered" value={stats.discovered} icon={Compass} />
          <Stat label="Reliable" value={stats.reliable} icon={ShieldCheck} />
          <Stat label="Mastered" value={stats.mastered} icon={Trophy} />
          <Stat label="Golden path" value={`${stats.goldenReliable}/60`} icon={Star} />
        </div>
      </section>

      <div className="atlas-dashboard-grid">
        <section className="atlas-panel atlas-active-panel">
          <PanelHeading eyebrow="Season loadout" title="Three active skills" action="Change in Atlas" onAction={onOpenAtlas} />
          {activeSkills.length ? (
            <div className="atlas-active-list">
              {activeSkills.map((skill) => (
                <button key={skill.id} onClick={() => onOpenSkill(skill.id)}>
                  <RankOrb skill={skill} rank={progress.ranks[skill.id] ?? 0} small />
                  <span><strong>{skill.name}</strong><small>{skill.domain} · {skill.path}</small></span><ChevronRight size={17} />
                </button>
              ))}
            </div>
          ) : <EmptyState icon={Pin} title="Choose your loadout" detail="Pin up to three skills so the app can build focused quests around them." action="Pick active skills" onAction={onOpenAtlas} />}
        </section>

        <section className="atlas-panel atlas-next-panel">
          <PanelHeading eyebrow="Smart recommendation" title="Best next unlocks" />
          <div className="atlas-recommend-list">
            {recommended.map((skill) => (
              <button key={skill.id} onClick={() => onOpenSkill(skill.id)}>
                <span className="atlas-recommend-list__tier">T{skill.tier}</span>
                <span><strong>{skill.name}</strong><small>{skill.path} · Power {skill.power}/10</small></span>
                {skill.goldenPath ? <Star size={15} /> : <ChevronRight size={15} />}
              </button>
            ))}
          </div>
        </section>

        <section className="atlas-panel atlas-quest-preview">
          <PanelHeading eyebrow="Today" title="Quick quests" />
          <div className="atlas-mini-quests">
            {quests.map((quest) => {
              const complete = Boolean(progress.completedQuests[quest.id])
              return (
                <article key={quest.id} className={complete ? 'complete' : ''}>
                  <span className="atlas-quest-check">{complete ? <Check size={15} /> : <CircleDot size={15} />}</span>
                  <div><strong>{quest.title}</strong><small>{quest.detail}</small></div>
                  <button disabled={complete} onClick={() => onCompleteQuest(quest)}>{complete ? 'Done' : `+${quest.xp} XP`}</button>
                </article>
              )
            })}
          </div>
        </section>

        <section className="atlas-panel atlas-domain-panel">
          <PanelHeading eyebrow="Whole build" title="Domain readiness" />
          <div className="atlas-domain-progress-grid">
            {atlasDomains.map((domain) => {
              const domainSkills = atlasSkills.filter((skill) => skill.domainId === domain.id)
              const rankTotal = domainSkills.reduce((sum, skill) => sum + (progress.ranks[skill.id] ?? 0), 0)
              const percent = Math.round((rankTotal / (domainSkills.length * 5)) * 100)
              const Icon = domainIcons[domain.icon] ?? Sparkles
              return (
                <div key={domain.id} style={{ '--domain-color': domain.color } as CSSProperties}>
                  <span><Icon size={17} /></span><strong>{domain.name}</strong><small>{percent}%</small><i><b style={{ width: `${percent}%` }} /></i>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function AtlasExplorer({ progress, onRankChange, onToggleActive, onNoteChange, onOpenMovement }: SkillActions & { progress: AtlasProgress }) {
  const [domainId, setDomainId] = useState('D01')
  const [pathId, setPathId] = useState('P01')
  const [query, setQuery] = useState('')
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)

  useEffect(() => {
    const listener = (event: Event) => {
      const skillId = (event as CustomEvent<string>).detail
      const skill = skillById.get(skillId)
      if (!skill) return
      setDomainId(skill.domainId)
      setPathId(skill.pathId)
      setSelectedSkillId(skill.id)
    }
    window.addEventListener('atlas-open-skill', listener)
    return () => window.removeEventListener('atlas-open-skill', listener)
  }, [])

  const selectedDomain = domainById.get(domainId) ?? atlasDomains[0]
  const domainPaths = atlasPaths.filter((path) => path.domainId === selectedDomain.id)
  const selectedPath = pathById.get(pathId) ?? domainPaths[0]
  const pathSkills = atlasSkills.filter((skill) => skill.pathId === selectedPath.id)
  const normalizedQuery = query.trim().toLowerCase()
  const matches = normalizedQuery ? atlasSkills.filter((skill) => [skill.name, skill.path, skill.domain, skill.description].some((value) => value.toLowerCase().includes(normalizedQuery))).slice(0, 80) : []
  const selectedSkill = selectedSkillId ? skillById.get(selectedSkillId) ?? null : null

  function chooseDomain(nextDomainId: string) {
    setDomainId(nextDomainId)
    setPathId(atlasPaths.find((path) => path.domainId === nextDomainId)?.id ?? 'P01')
    setSelectedSkillId(null)
    setQuery('')
  }

  return (
    <div className="atlas-page atlas-explorer-page">
      <header className="atlas-page-header atlas-explorer-header">
        <div><span className="atlas-eyebrow">10 domains · 100 paths · 1,000 skills</span><h1>Skill atlas</h1><p>Open a domain, choose a path, and climb only as high as your real life requires.</p></div>
        <label className="atlas-search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all 1,000 skills" />{query ? <button onClick={() => setQuery('')}><X size={16} /></button> : null}</label>
      </header>

      <div className="atlas-domain-tabs">
        {atlasDomains.map((domain) => {
          const Icon = domainIcons[domain.icon] ?? Sparkles
          return <button key={domain.id} className={domain.id === domainId ? 'active' : ''} style={{ '--domain-color': domain.color } as CSSProperties} onClick={() => chooseDomain(domain.id)}><Icon size={17} /><span>{domain.name}</span></button>
        })}
      </div>

      {normalizedQuery ? (
        <section className="atlas-search-results atlas-panel">
          <div className="atlas-search-results__heading"><div><span className="atlas-eyebrow">Global results</span><h2>{matches.length} matches shown</h2></div><small>Search checks names, paths, domains, and descriptions.</small></div>
          <div className="atlas-result-grid">
            {matches.map((skill) => (
              <button key={skill.id} onClick={() => { setDomainId(skill.domainId); setPathId(skill.pathId); setSelectedSkillId(skill.id); setQuery('') }}>
                <RankOrb skill={skill} rank={progress.ranks[skill.id] ?? 0} small />
                <span><strong>{skill.name}</strong><small>{skill.domain} · {skill.path} · Tier {skill.tier}</small></span>
                {skill.goldenPath ? <Star size={16} /> : <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="atlas-explorer-layout">
          <aside className="atlas-path-browser atlas-panel">
            <div className="atlas-path-browser__intro" style={{ '--domain-color': selectedDomain.color } as CSSProperties}>
              <span><DomainIcon domainId={selectedDomain.id} /></span><div><h2>{selectedDomain.name}</h2><p>{selectedDomain.description}</p></div>
            </div>
            <div className="atlas-path-list">
              {domainPaths.map((path) => {
                const ranks = atlasSkills.filter((skill) => skill.pathId === path.id).map((skill) => progress.ranks[skill.id] ?? 0)
                const reliable = ranks.filter((rank) => rank >= 3).length
                return <button key={path.id} className={path.id === selectedPath.id ? 'active' : ''} onClick={() => { setPathId(path.id); setSelectedSkillId(null) }}><span><strong>{path.name}</strong><small>{reliable}/10 reliable</small></span><ChevronRight size={16} /></button>
              })}
            </div>
          </aside>

          <section className="atlas-path-stage atlas-panel" style={{ '--domain-color': selectedDomain.color } as CSSProperties}>
            <header><div><span className="atlas-eyebrow">{selectedDomain.name} · {selectedPath.id}</span><h2>{selectedPath.name}</h2><p>{capitalize(selectedPath.goal)}.</p></div><div className="atlas-path-score"><strong>{pathSkills.filter((skill) => (progress.ranks[skill.id] ?? 0) >= 3).length}</strong><small>reliable</small></div></header>
            <div className="atlas-skill-ladder">
              {pathSkills.map((skill, index) => {
                const rank = progress.ranks[skill.id] ?? 0
                const unlocked = isSkillUnlocked(skill, progress.ranks)
                return (
                  <div className="atlas-ladder-step" key={skill.id}>
                    {index ? <span className={`atlas-ladder-rail ${unlocked ? 'unlocked' : ''}`} /> : null}
                    <button className={`${unlocked ? 'unlocked' : 'locked'} ${rank >= 3 ? 'reliable' : ''}`} onClick={() => setSelectedSkillId(skill.id)}>
                      <RankOrb skill={skill} rank={rank} />
                      <span className="atlas-ladder-copy"><small>Tier {skill.tier} · {rankLabel(rank)}</small><strong>{skill.name}</strong><em>{skill.estimatedHours}h estimated · Power {skill.power}/10</em></span>
                      <span className="atlas-ladder-action">{unlocked ? <ChevronRight size={18} /> : <LockKeyhole size={16} />}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {selectedSkill ? <SkillDrawer skill={selectedSkill} progress={progress} onClose={() => setSelectedSkillId(null)} onRankChange={onRankChange} onToggleActive={onToggleActive} onNoteChange={onNoteChange} onOpenMovement={onOpenMovement} /> : null}
    </div>
  )
}

function GoldenPath({ progress, onRankChange, onToggleActive, onNoteChange, onOpenMovement }: SkillActions & { progress: AtlasProgress }) {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const groups = Array.from(new Set(goldenPathSkills.map((skill) => skill.pathId))).map((pathId) => ({ path: pathById.get(pathId)!, skills: goldenPathSkills.filter((skill) => skill.pathId === pathId) }))
  const selectedSkill = selectedSkillId ? skillById.get(selectedSkillId) ?? null : null
  const reliable = goldenPathSkills.filter((skill) => (progress.ranks[skill.id] ?? 0) >= 3).length

  return (
    <div className="atlas-page atlas-golden-page">
      <header className="atlas-page-header"><div><span className="atlas-eyebrow">Maximum capability per hour</span><h1>Golden path</h1><p>Sixty foundation nodes selected for power, synergy, and low maintenance. This route is the main campaign; the rest of the atlas is optional.</p></div><div className="atlas-golden-total"><Star size={20} /><strong>{reliable}/60</strong><span>reliable</span></div></header>
      <div className="atlas-golden-grid">
        {groups.map(({ path, skills }) => {
          const domain = domainById.get(path.domainId)!
          return (
            <section key={path.id} className="atlas-golden-path atlas-panel" style={{ '--domain-color': domain.color } as CSSProperties}>
              <header><span><DomainIcon domainId={domain.id} /></span><div><small>{domain.name}</small><h2>{path.name}</h2></div><strong>{skills.filter((skill) => (progress.ranks[skill.id] ?? 0) >= 3).length}/5</strong></header>
              <div>{skills.map((skill) => { const rank = progress.ranks[skill.id] ?? 0; return <button key={skill.id} onClick={() => setSelectedSkillId(skill.id)}><RankOrb skill={skill} rank={rank} small /><span><strong>{skill.name}</strong><small>{rankLabel(rank)}</small></span><ChevronRight size={15} /></button> })}</div>
            </section>
          )
        })}
      </div>
      {selectedSkill ? <SkillDrawer skill={selectedSkill} progress={progress} onClose={() => setSelectedSkillId(null)} onRankChange={onRankChange} onToggleActive={onToggleActive} onNoteChange={onNoteChange} onOpenMovement={onOpenMovement} /> : null}
    </div>
  )
}

function QuestBoard({ progress, onCompleteQuest, onOpenAtlas }: { progress: AtlasProgress; onCompleteQuest: (quest: Quest) => void; onOpenAtlas: () => void }) {
  const quests = buildQuests(progress)
  const daily = quests.filter((quest) => quest.kind === 'daily')
  const weekly = quests.filter((quest) => quest.kind === 'weekly')
  const active = progress.activeSkillIds.map((id) => skillById.get(id)).filter(Boolean) as AtlasSkill[]

  return (
    <div className="atlas-page atlas-quests-page">
      <header className="atlas-page-header"><div><span className="atlas-eyebrow">Proof over grinding</span><h1>Quest board</h1><p>Quests reward focused practice, demonstrations, projects, and maintenance—not endless tapping or fake streaks.</p></div><button className="atlas-secondary-button" onClick={onOpenAtlas}><Pin size={17} /> Edit active skills</button></header>
      <section className="atlas-quest-loadout atlas-panel"><div><span className="atlas-eyebrow">Current loadout</span><h2>{active.length ? active.map((skill) => skill.name).join(' · ') : 'No active skills selected'}</h2><p>Pin up to three skills in the Atlas. Quest generation adapts to that loadout.</p></div><div className="atlas-loadout-orbs">{active.map((skill) => <RankOrb key={skill.id} skill={skill} rank={progress.ranks[skill.id] ?? 0} />)}{Array.from({ length: Math.max(0, 3 - active.length) }).map((_, index) => <span className="atlas-empty-orb" key={index}><Plus size={20} /></span>)}</div></section>
      <div className="atlas-quest-columns">
        <section className="atlas-panel"><PanelHeading eyebrow="Resets daily" title="Daily missions" /><div className="atlas-quest-list">{daily.map((quest) => <QuestCard key={quest.id} quest={quest} complete={Boolean(progress.completedQuests[quest.id])} onComplete={onCompleteQuest} />)}</div></section>
        <section className="atlas-panel atlas-boss-panel"><PanelHeading eyebrow="Weekly boss" title="Demonstrate real ability" /><div className="atlas-quest-list">{weekly.map((quest) => <QuestCard key={quest.id} quest={quest} complete={Boolean(progress.completedQuests[quest.id])} onComplete={onCompleteQuest} boss />)}</div><div className="atlas-proof-rule"><Award size={22} /><div><strong>The honor rule</strong><p>Only claim a quest after doing the stated work. The app tracks progress; it does not pretend to verify your life.</p></div></div></section>
      </div>
    </div>
  )
}

function MovementLab({ mode, exercise, onModeChange, onAnalyze }: { mode: MovementMode; exercise: ExerciseId; onModeChange: (mode: MovementMode) => void; onAnalyze: (exerciseId: ExerciseId) => void }) {
  return <div className="atlas-movement-page"><div className="atlas-movement-switcher"><button className={mode === 'map' ? 'active' : ''} onClick={() => onModeChange('map')}><Map size={17} /> Calisthenics map</button><button className={mode === 'analyzer' ? 'active' : ''} onClick={() => onModeChange('analyzer')}><Camera size={17} /> Camera analyzer</button></div>{mode === 'map' ? <SkillTree onAnalyze={onAnalyze} /> : <FormCheck key={exercise} initialExercise={exercise} />}</div>
}

function SystemPage({ progress, onReset }: { progress: AtlasProgress; onReset: () => void }) {
  return (
    <div className="atlas-page atlas-system-page">
      <header className="atlas-page-header"><div><span className="atlas-eyebrow">How the system works</span><h1>Superhuman, not overwhelmed</h1><p>The Atlas is designed to make you unusually capable without turning every free moment into mandatory training.</p></div></header>
      <div className="atlas-system-grid">
        <section className="atlas-panel"><Target size={28} /><h2>Three active lines</h2><p>Keep only three skills active. Everything else stays visible but does not demand attention.</p></section>
        <section className="atlas-panel"><ShieldCheck size={28} /><h2>Reliable beats perfect</h2><p>Rank three means you can use the skill independently. Mastery is optional and should be reserved for abilities you truly care about.</p></section>
        <section className="atlas-panel"><Clock size={28} /><h2>Tiny maintenance</h2><p>Once an ability becomes reliable, define the smallest routine that keeps it available.</p></section>
        <section className="atlas-panel"><BookOpen size={28} /><h2>Proof tests</h2><p>Skills rank up through demonstrations and projects rather than passive reading or artificial streaks.</p></section>
      </div>
      <section className="atlas-data-panel atlas-panel"><div><span className="atlas-eyebrow">Local save</span><h2>Your data</h2><p>{Object.keys(progress.ranks).length} skills contain progress, {progress.activeSkillIds.length} are active, and {Object.keys(progress.completedQuests).length} quests are complete.</p></div><button className="atlas-danger-button" onClick={onReset}><RotateCcw size={17} /> Reset all progress</button></section>
      <section className="atlas-origin-panel atlas-panel"><Zap size={30} /><div><span className="atlas-eyebrow">Origin mission</span><h2>Build one useful thing while improving your learning engine and physical foundation.</h2><p>Completing that combined project unlocks the personal title <strong>Emerging Polymath</strong>.</p></div></section>
    </div>
  )
}

type SkillActions = {
  onRankChange: (skillId: string, rank: number) => void
  onToggleActive: (skillId: string) => void
  onNoteChange: (skillId: string, note: string) => void
  onOpenMovement: (exercise?: ExerciseId) => void
}

function SkillDrawer({ skill, progress, onClose, onRankChange, onToggleActive, onNoteChange, onOpenMovement }: SkillActions & { skill: AtlasSkill; progress: AtlasProgress; onClose: () => void }) {
  const rank = progress.ranks[skill.id] ?? 0
  const unlocked = isSkillUnlocked(skill, progress.ranks)
  const active = progress.activeSkillIds.includes(skill.id)
  const domain = domainById.get(skill.domainId)!
  const prerequisite = skill.prerequisiteIds[0] ? skillById.get(skill.prerequisiteIds[0]) : null
  const next = skillById.get(`${skill.pathId}-S${String(skill.tier + 1).padStart(2, '0')}`)
  const analyzerExercise = analyzerForSkill(skill)

  return (
    <aside className="atlas-skill-drawer" style={{ '--domain-color': domain.color } as CSSProperties}>
      <button className="atlas-drawer-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
      <div className="atlas-drawer-heading"><RankOrb skill={skill} rank={rank} /><div><span className="atlas-eyebrow">{skill.domain} · {skill.path}</span><h2>{skill.name}</h2><p>Tier {skill.tier} · {rankLabel(rank)}</p></div></div>
      {skill.goldenPath ? <div className="atlas-golden-badge"><Star size={15} /> Golden path skill</div> : null}
      {!unlocked ? <div className="atlas-lock-note"><LockKeyhole size={17} /><span>Reach Capable in {prerequisite?.name ?? 'the prerequisite'} to unlock progression.</span></div> : null}
      <p className="atlas-drawer-summary">{skill.description}</p>
      <div className="atlas-metric-grid"><Metric icon={Gauge} label="Power" value={`${skill.power}/10`} /><Metric icon={Zap} label="Synergy" value={`${skill.synergy}/10`} /><Metric icon={Clock} label="Estimate" value={`${skill.estimatedHours}h`} /><Metric icon={RotateCcw} label="Maintain" value={`${skill.maintenanceMinutesPerMonth}m/mo`} /></div>
      <section className="atlas-drawer-section">
        <div className="atlas-drawer-section__heading"><div><span className="atlas-eyebrow">Progress rank</span><h3>What can you demonstrate?</h3></div><strong>{rank}/5</strong></div>
        <div className="atlas-rank-selector">{RANKS.slice(1).map((label, index) => { const value = index + 1; return <button key={label} disabled={!unlocked} className={rank === value ? 'active' : rank > value ? 'passed' : ''} onClick={() => onRankChange(skill.id, value)}><span>{value}</span><small>{label}</small></button> })}</div>
        {rank ? <button className="atlas-text-button" onClick={() => onRankChange(skill.id, 0)}><Minus size={14} /> Clear this skill</button> : null}
      </section>
      <section className="atlas-proof-card"><Target size={20} /><div><span className="atlas-eyebrow">Proof test</span><p>{skill.proof}</p></div></section>
      <section className="atlas-drawer-section atlas-chain-section"><span className="atlas-eyebrow">Path connections</span><div>{prerequisite ? <span><small>Requires</small><strong>{prerequisite.name}</strong></span> : <span><small>Requires</small><strong>No prerequisite</strong></span>}<ChevronRight size={17} />{next ? <span><small>Leads to</small><strong>{next.name}</strong></span> : <span><small>Leads to</small><strong>Path complete</strong></span>}</div></section>
      <section className="atlas-drawer-section"><label className="atlas-note-field"><span className="atlas-eyebrow">Evidence and notes</span><textarea value={progress.notes[skill.id] ?? ''} onChange={(event) => onNoteChange(skill.id, event.target.value)} placeholder="Record what you practiced, built, tested, or demonstrated…" /></label></section>
      <div className="atlas-drawer-actions"><button className={active ? 'atlas-secondary-button active' : 'atlas-primary-button'} onClick={() => onToggleActive(skill.id)}><Pin size={17} />{active ? 'Remove from loadout' : 'Make active'}</button>{analyzerExercise ? <button className="atlas-secondary-button" onClick={() => onOpenMovement(analyzerExercise)}><Camera size={17} /> Check form</button> : null}</div>
    </aside>
  )
}

function QuestCard({ quest, complete, onComplete, boss = false }: { quest: Quest; complete: boolean; onComplete: (quest: Quest) => void; boss?: boolean }) {
  return <article className={`atlas-quest-card ${complete ? 'complete' : ''} ${boss ? 'boss' : ''}`}><span className="atlas-quest-card__icon">{complete ? <Check /> : boss ? <Trophy /> : <Target />}</span><div><span className="atlas-eyebrow">{boss ? 'Boss quest' : 'Mission'} · {quest.xp} XP</span><h3>{quest.title}</h3><p>{quest.detail}</p></div><button disabled={complete} onClick={() => onComplete(quest)}>{complete ? 'Completed' : 'Claim after completion'}</button></article>
}

function RankOrb({ skill, rank, small = false }: { skill: AtlasSkill; rank: number; small?: boolean }) {
  const domain = domainById.get(skill.domainId)!
  return <span className={`atlas-rank-orb ${small ? 'small' : ''} rank-${rank}`} style={{ '--domain-color': domain.color } as CSSProperties}><span>{rank || skill.tier}</span>{skill.goldenPath ? <Star size={small ? 9 : 11} /> : null}</span>
}

function DomainIcon({ domainId }: { domainId: string }) {
  const domain = domainById.get(domainId)!
  const Icon = domainIcons[domain.icon] ?? Sparkles
  return <Icon size={21} />
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return <div><Icon size={17} /><span><strong>{value}</strong><small>{label}</small></span></div>
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div><Icon size={17} /><span><small>{label}</small><strong>{value}</strong></span></div>
}

function PanelHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <header className="atlas-panel-heading"><div><span className="atlas-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action && onAction ? <button onClick={onAction}>{action}<ChevronRight size={14} /></button> : null}</header>
}

function EmptyState({ icon: Icon, title, detail, action, onAction }: { icon: LucideIcon; title: string; detail: string; action: string; onAction: () => void }) {
  return <div className="atlas-empty-state"><Icon size={25} /><h3>{title}</h3><p>{detail}</p><button onClick={onAction}>{action}</button></div>
}

function getRecommendedSkills(ranks: Record<string, number>, limit: number) {
  return atlasSkills.filter((skill) => isSkillUnlocked(skill, ranks) && (ranks[skill.id] ?? 0) < 3).sort((a, b) => Number(b.goldenPath) - Number(a.goldenPath) || b.synergy - a.synergy || b.power - a.power || a.tier - b.tier).slice(0, limit)
}

function isSkillUnlocked(skill: AtlasSkill, ranks: Record<string, number>) {
  return skill.prerequisiteIds.length === 0 || skill.prerequisiteIds.every((id) => (ranks[id] ?? 0) >= 2)
}

function analyzerForSkill(skill: AtlasSkill): ExerciseId | undefined {
  const name = skill.name.toLowerCase()
  if (name.includes('push-up') || name === 'push strength') return 'push-up'
  if (name.includes('squat')) return 'squat'
  if (name.includes('plank') || name.includes('body tension')) return 'plank'
  if (name.includes('handstand')) return 'handstand'
  if (name.includes('front lever')) return 'front-lever'
  return undefined
}

function buildQuests(progress: AtlasProgress): Quest[] {
  const today = new Date().toISOString().slice(0, 10)
  const week = weekKey(new Date())
  const active = progress.activeSkillIds.map((id) => skillById.get(id)).filter(Boolean) as AtlasSkill[]
  const selected = active.length ? active : getRecommendedSkills(progress.ranks, 3)
  const daily: Quest[] = selected.slice(0, 3).map((skill, index) => ({
    id: `${today}-practice-${skill.id}`,
    title: index === 0 ? `Train ${skill.name}` : index === 1 ? `Test ${skill.name}` : `Explain ${skill.name}`,
    detail: index === 0 ? 'Complete one focused 10–25 minute practice session and record what changed.' : index === 1 ? `Attempt the current proof standard: ${skill.proof}` : 'Explain the idea simply from memory or demonstrate it to another person.',
    xp: 25 + index * 10,
    kind: 'daily',
    skillId: skill.id
  }))
  while (daily.length < 3) {
    const index = daily.length
    daily.push({ id: `${today}-foundation-${index}`, title: ['Ten-minute movement reset', 'Twenty-five-minute focus chamber', 'Problem hunter'][index], detail: ['Complete a short mobility, posture, and joint-control routine.', 'Work on one useful task with notifications and distractions removed.', 'Write down one recurring annoyance that could become a project or automation.'][index], xp: 25 + index * 10, kind: 'daily' })
  }
  const names = selected.map((skill) => skill.name)
  return [...daily, {
    id: `${week}-boss-demonstration`,
    title: names.length >= 2 ? `${names[0]} + ${names[1]} combination trial` : 'Build a useful proof project',
    detail: names.length >= 2 ? `Create one small challenge or project that requires both ${names[0]} and ${names[1]}. Save evidence and one lesson learned.` : 'Choose one skill, use it in a real task, document the result, and identify the next bottleneck.',
    xp: 250,
    kind: 'weekly'
  }, {
    id: `${week}-boss-maintenance`,
    title: 'Capability maintenance circuit',
    detail: 'Revisit three previously learned abilities for five minutes each. Confirm what remains reliable and what needs refreshing.',
    xp: 120,
    kind: 'weekly'
  }]
}

function weekKey(date: Date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = copy.getUTCDay() || 7
  copy.setUTCDate(copy.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function emptyProgress(): AtlasProgress {
  return { ranks: {}, activeSkillIds: [], notes: {}, completedQuests: {}, bonusXp: 0 }
}

function loadProgress(): AtlasProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<AtlasProgress>
    return {
      ranks: parsed.ranks ?? {},
      activeSkillIds: parsed.activeSkillIds ?? [],
      notes: parsed.notes ?? {},
      completedQuests: parsed.completedQuests ?? {},
      bonusXp: parsed.bonusXp ?? 0
    }
  } catch {
    return emptyProgress()
  }
}
