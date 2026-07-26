import { CheckCircle2, Circle, PauseCircle, ScanLine } from 'lucide-react'
import type { CalibrationState } from '../types'

type Props = {
  calibration: CalibrationState
}

export function CalibrationOverlay({ calibration }: Props) {
  const status = calibration.calibrated
    ? calibration.trackingValid
      ? 'ready'
      : 'paused'
    : 'calibrating'

  return (
    <div className={`calibration-overlay calibration-overlay--${status}`}>
      <div className="calibration-overlay__header">
        <div className="calibration-overlay__icon">
          {status === 'ready' ? <CheckCircle2 size={20} /> : status === 'paused' ? <PauseCircle size={20} /> : <ScanLine size={20} />}
        </div>
        <div>
          <span>{status === 'ready' ? 'Camera ready' : status === 'paused' ? 'Tracking paused' : 'Camera calibration'}</span>
          <strong>{calibration.message}</strong>
        </div>
        <span className="calibration-overlay__progress">{calibration.progress}%</span>
      </div>

      <div className="calibration-progress-track" aria-hidden="true">
        <span style={{ width: `${calibration.progress}%` }} />
      </div>

      <div className="calibration-checks">
        {calibration.checks.map((check) => (
          <div className={check.passed ? 'calibration-check is-passed' : 'calibration-check'} key={check.id}>
            {check.passed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
            <span>{check.label}</span>
            <small>{check.detail}</small>
          </div>
        ))}
      </div>

      {calibration.lockedSide ? (
        <div className="calibration-side-note">
          Tracking side locked: <strong>{calibration.lockedSide}</strong>
          {calibration.sideSwitchPending ? ' · finishing current attempt before switching' : ''}
          {calibration.sideSwitched ? ' · side changed safely' : ''}
        </div>
      ) : calibration.recommendedSide ? (
        <div className="calibration-side-note">
          Calibrating strongest side: <strong>{calibration.recommendedSide}</strong>
        </div>
      ) : null}
    </div>
  )
}
