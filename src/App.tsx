import { useState } from 'react'
import { Activity, GitBranch, Info, ShieldCheck } from 'lucide-react'
import { FormCheck } from './components/FormCheck'
import { SkillTree } from './components/SkillTree'
import type { AppPage, ExerciseId } from './types'

export default function App() {
  const [page, setPage] = useState<AppPage>('tree')
  const [exercise, setExercise] = useState<ExerciseId>('push-up')

  function analyze(exerciseId: ExerciseId) {
    setExercise(exerciseId)
    setPage('form')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={23} /></div>
          <div>
            <strong>Formcheck</strong>
            <span>Calisthenics map + coach</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <button className={page === 'tree' ? 'active' : ''} onClick={() => setPage('tree')}>
            <GitBranch size={20} />
            <span><strong>Skill tree</strong><small>Explore progressions</small></span>
          </button>
          <button className={page === 'form' ? 'active' : ''} onClick={() => setPage('form')}>
            <Activity size={20} />
            <span><strong>Form check</strong><small>Camera feedback</small></span>
          </button>
          <button className={page === 'about' ? 'active' : ''} onClick={() => setPage('about')}>
            <Info size={20} />
            <span><strong>About</strong><small>Offline and private</small></span>
          </button>
        </nav>

        <div className="privacy-card">
          <ShieldCheck size={22} />
          <div>
            <strong>Local by default</strong>
            <p>No account, cloud upload, workout log, streak, XP, or subscription.</p>
          </div>
        </div>
        <span className="version-label">Build 0.4.0</span>
      </aside>

      <main className="app-main">
        {page === 'tree' ? <SkillTree onAnalyze={analyze} /> : null}
        {page === 'form' ? <FormCheck key={exercise} initialExercise={exercise} /> : null}
        {page === 'about' ? <About /> : null}
      </main>
    </div>
  )
}

function About() {
  return (
    <section className="workspace about-workspace">
      <div className="about-card panel">
        <span className="eyebrow">Purposefully focused</span>
        <h1>Two tools. Nothing distracting.</h1>
        <p className="about-lead">Formcheck is an offline calisthenics reference built around a large skill roadmap and exercise-specific camera feedback.</p>
        <div className="about-grid">
          <article>
            <GitBranch size={28} />
            <h2>Skill tree</h2>
            <p>Browse prerequisites, progressions, standards, technique cues, and common mistakes without being forced into a workout plan.</p>
          </article>
          <article>
            <Activity size={28} />
            <h2>Form checker</h2>
            <p>Select an exercise, use the laptop webcam or import a video recorded on your phone, and receive local pose-based feedback.</p>
          </article>
          <article>
            <ShieldCheck size={28} />
            <h2>Offline privacy</h2>
            <p>The packaged app includes its pose model and processing files. Camera frames and selected videos are not sent to a server.</p>
          </article>
        </div>
        <div className="scope-note">
          <strong>Current movement templates</strong>
          <p>Push-up, bodyweight squat, plank, handstand, and front lever. More movements can be added as individual rule files without changing the app structure.</p>
        </div>
      </div>
    </section>
  )
}
