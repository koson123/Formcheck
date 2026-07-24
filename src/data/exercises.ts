import type { ExerciseDefinition } from '../types'

export const exercises: ExerciseDefinition[] = [
  {
    id: 'push-up',
    name: 'Push-up',
    mode: 'dynamic',
    cameraAngle: 'Side view',
    setup: [
      'Place the camera about 8 feet away at hip height.',
      'Keep your entire body, including hands and feet, inside the frame.',
      'Face sideways so the camera can see elbow depth and body alignment.'
    ],
    tracked: ['Rep count', 'Elbow depth', 'Full lockout', 'Hip sag or piking', 'Body control']
  },
  {
    id: 'squat',
    name: 'Bodyweight squat',
    mode: 'dynamic',
    cameraAngle: 'Side view',
    setup: [
      'Place the camera around knee-to-hip height.',
      'Stand sideways with your full body visible.',
      'Keep enough space above your head and below your feet.'
    ],
    tracked: ['Rep count', 'Knee depth', 'Standing lockout', 'Torso position', 'Control']
  },
  {
    id: 'plank',
    name: 'Plank',
    mode: 'static',
    cameraAngle: 'Side view',
    setup: [
      'Place the camera at floor level or slightly above.',
      'Show shoulders, hips, knees, and ankles.',
      'Hold still for a moment before starting.'
    ],
    tracked: ['Hold time', 'Shoulder–hip–ankle line', 'Hip sag', 'Hip pike']
  },
  {
    id: 'handstand',
    name: 'Handstand',
    mode: 'static',
    cameraAngle: 'Side view',
    setup: [
      'Place the camera far enough away to show hands through feet.',
      'Use a clear side view.',
      'Start with a wall handstand if you are not comfortable freestanding.'
    ],
    tracked: ['Hold time', 'Elbow lockout', 'Shoulder opening', 'Hip stack', 'Body line']
  },
  {
    id: 'front-lever',
    name: 'Front lever',
    mode: 'static',
    cameraAngle: 'Side view',
    setup: [
      'Place the camera perpendicular to the bar.',
      'Show hands, shoulders, hips, knees, and feet.',
      'Choose a progression you can control safely.'
    ],
    tracked: ['Hold time', 'Body angle to horizontal', 'Elbow lockout', 'Hip height', 'Body line']
  }
]
