import type { Skill, SkillLink } from '../types'

export const skills: Skill[] = [
  {
    id: 'body-awareness', name: 'Body Awareness', category: 'foundation', difficulty: 'Foundation', x: 0, y: 0,
    summary: 'Learn hollow, arch, bracing, and deliberate joint positioning.', standard: 'Move between hollow and arch without losing control.',
    prerequisites: [], leadsTo: ['hollow-hold', 'plank', 'active-hang'],
    cues: ['Brace before moving.', 'Keep breathing while maintaining tension.'],
    commonMistakes: ['Holding the breath', 'Moving without active tension']
  },
  {
    id: 'wrist-prep', name: 'Wrist Preparation', category: 'mobility', difficulty: 'Foundation', x: -420, y: 120,
    summary: 'Build comfortable wrist extension and basic loading tolerance.', standard: 'Comfortable 30-second quadruped wrist lean.',
    prerequisites: [], leadsTo: ['push-up', 'frog-stand', 'wall-handstand'],
    cues: ['Spread the fingers.', 'Increase pressure gradually.'], commonMistakes: ['Forcing painful range', 'Collapsing into the heel of the hand']
  },
  {
    id: 'shoulder-flexion', name: 'Overhead Shoulder Mobility', category: 'mobility', difficulty: 'Foundation', x: 420, y: 120,
    summary: 'Develop the overhead range needed for a stacked handstand.', standard: 'Arms reach overhead without rib flare.',
    prerequisites: [], leadsTo: ['wall-handstand', 'handstand'], cues: ['Keep ribs down.', 'Reach long through the fingertips.'],
    commonMistakes: ['Arching the lower back', 'Shrugging without upward rotation']
  },
  {
    id: 'hollow-hold', name: 'Hollow Body Hold', category: 'core', difficulty: 'Beginner', x: -120, y: 180,
    summary: 'Foundational body-tension position for nearly every advanced skill.', standard: '30 seconds with lower back firmly pressed down.',
    prerequisites: ['body-awareness'], leadsTo: ['tuck-lsit', 'front-lever-tuck', 'dragon-flag-negative'],
    cues: ['Posteriorly tilt the pelvis.', 'Reach ribs toward hips.'], commonMistakes: ['Lower back lifting', 'Neck straining']
  },
  {
    id: 'plank', name: 'Plank', category: 'core', difficulty: 'Beginner', x: -280, y: 300,
    summary: 'Straight-body support with active shoulders and braced trunk.', standard: '45 seconds with a straight shoulder–hip–ankle line.',
    prerequisites: ['body-awareness'], leadsTo: ['push-up', 'side-plank'], cues: ['Push the floor away.', 'Squeeze glutes lightly.'],
    commonMistakes: ['Hips sagging', 'Hips too high'], analyzerExercise: 'plank', cameraAngle: 'Side view'
  },
  {
    id: 'active-hang', name: 'Active Hang', category: 'pull', difficulty: 'Beginner', x: 260, y: 300,
    summary: 'Hang with the shoulders actively depressed instead of collapsing.', standard: '20 seconds with straight elbows and active shoulders.',
    prerequisites: ['body-awareness'], leadsTo: ['scap-pull', 'skin-the-cat', 'front-lever-tuck'],
    cues: ['Pull shoulders away from ears.', 'Keep elbows straight.'], commonMistakes: ['Bending elbows', 'Losing rib control']
  },
  {
    id: 'push-up', name: 'Push-up', category: 'push', difficulty: 'Beginner', x: -520, y: 430,
    summary: 'Basic horizontal pushing strength with whole-body tension.', standard: '10 clean reps with chest depth and full lockout.',
    prerequisites: ['plank', 'wrist-prep'], leadsTo: ['diamond-push-up', 'archer-push-up', 'pseudo-planche-push-up'],
    cues: ['Move as one unit.', 'Keep forearms close to vertical.'], commonMistakes: ['Hips sagging', 'Partial depth', 'Elbows flaring excessively'],
    analyzerExercise: 'push-up', cameraAngle: 'Side view'
  },
  {
    id: 'scap-pull', name: 'Scapular Pull-up', category: 'pull', difficulty: 'Beginner', x: 520, y: 430,
    summary: 'Move the shoulder blades while keeping the elbows straight.', standard: '10 controlled reps without swinging.',
    prerequisites: ['active-hang'], leadsTo: ['negative-pull-up', 'front-lever-tuck'], cues: ['Initiate from the shoulder blades.', 'Keep ribs controlled.'],
    commonMistakes: ['Turning it into a bent-arm pull-up', 'Using momentum']
  },
  {
    id: 'bodyweight-squat', name: 'Bodyweight Squat', category: 'legs', difficulty: 'Beginner', x: 760, y: 180,
    summary: 'Foundational lower-body pattern through a comfortable range.', standard: '15 controlled reps to a consistent depth.',
    prerequisites: ['body-awareness'], leadsTo: ['split-squat', 'assisted-pistol'], cues: ['Keep the whole foot connected.', 'Sit between the hips.'],
    commonMistakes: ['Heels lifting', 'Rushing the bottom'], analyzerExercise: 'squat', cameraAngle: 'Side view'
  },
  {
    id: 'diamond-push-up', name: 'Diamond Push-up', category: 'push', difficulty: 'Intermediate', x: -760, y: 590,
    summary: 'A closer-grip push-up emphasizing triceps strength.', standard: '10 controlled reps with full range.',
    prerequisites: ['push-up'], leadsTo: ['straight-bar-dip'], cues: ['Keep shoulders stable.', 'Finish every rep.'], commonMistakes: ['Hands too narrow for comfort', 'Losing body line']
  },
  {
    id: 'archer-push-up', name: 'Archer Push-up', category: 'push', difficulty: 'Intermediate', x: -560, y: 680,
    summary: 'Shift most of the load to one arm while the other remains long.', standard: '5 controlled reps per side.',
    prerequisites: ['push-up'], leadsTo: ['one-arm-push-up'], cues: ['Shift the chest toward the working hand.', 'Keep hips square.'],
    commonMistakes: ['Rotating the torso', 'Bending the support arm too much']
  },
  {
    id: 'pseudo-planche-push-up', name: 'Pseudo Planche Push-up', category: 'push', difficulty: 'Intermediate', x: -360, y: 610,
    summary: 'Lean shoulders forward to build planche-specific pressing strength.', standard: '8 reps with a consistent forward lean.',
    prerequisites: ['push-up', 'wrist-prep'], leadsTo: ['planche-lean'], cues: ['Turn elbows back.', 'Keep shoulders in front of hands.'],
    commonMistakes: ['Losing the lean', 'Piking the hips']
  },
  {
    id: 'negative-pull-up', name: 'Negative Pull-up', category: 'pull', difficulty: 'Beginner', x: 660, y: 570,
    summary: 'Lower slowly from the top of a pull-up.', standard: '5 descents lasting at least 5 seconds.',
    prerequisites: ['scap-pull'], leadsTo: ['pull-up'], cues: ['Start with chest tall.', 'Lower under control.'], commonMistakes: ['Dropping through the bottom', 'Shrugging early']
  },
  {
    id: 'pull-up', name: 'Pull-up', category: 'pull', difficulty: 'Intermediate', x: 620, y: 740,
    summary: 'Vertical pulling strength from a dead hang to chin over bar.', standard: '8 clean reps without kipping.',
    prerequisites: ['negative-pull-up'], leadsTo: ['chest-to-bar', 'archer-pull-up', 'muscle-up'], cues: ['Drive elbows down.', 'Keep legs quiet.'],
    commonMistakes: ['Kipping', 'Stopping short of the top']
  },
  {
    id: 'straight-bar-dip', name: 'Straight-bar Dip', category: 'push', difficulty: 'Intermediate', x: -850, y: 760,
    summary: 'Top-bar pressing strength used in the muscle-up transition.', standard: '8 clean reps above the bar.',
    prerequisites: ['diamond-push-up'], leadsTo: ['muscle-up'], cues: ['Stay close to the bar.', 'Lock out strongly.'], commonMistakes: ['Dropping too deep without control', 'Letting shoulders roll forward']
  },
  {
    id: 'chest-to-bar', name: 'Chest-to-bar Pull-up', category: 'pull', difficulty: 'Advanced', x: 770, y: 900,
    summary: 'Explosive pull bringing the chest clearly to bar height.', standard: '5 clean high pulls.',
    prerequisites: ['pull-up'], leadsTo: ['muscle-up'], cues: ['Pull fast after a controlled start.', 'Drive the elbows behind you.'],
    commonMistakes: ['Large kip', 'Pulling only to chin height']
  },
  {
    id: 'muscle-up', name: 'Muscle-up', category: 'pull', difficulty: 'Advanced', x: 300, y: 1030,
    summary: 'Transition from a pull below the bar to a support above it.', standard: 'One controlled rep with minimal kip.',
    prerequisites: ['chest-to-bar', 'straight-bar-dip'], leadsTo: ['strict-muscle-up'], cues: ['Pull high before turning over.', 'Keep the bar close.'],
    commonMistakes: ['Chicken-wing transition', 'Pulling too low']
  },
  {
    id: 'strict-muscle-up', name: 'Strict Muscle-up', category: 'pull', difficulty: 'Elite', x: 300, y: 1200,
    summary: 'A muscle-up performed without a meaningful kip.', standard: 'One smooth strict rep.',
    prerequisites: ['muscle-up'], leadsTo: [], cues: ['Stay hollow.', 'Accelerate through the pull.'], commonMistakes: ['Hidden hip drive', 'Slow low transition']
  },
  {
    id: 'frog-stand', name: 'Frog Stand', category: 'balance', difficulty: 'Beginner', x: -180, y: 470,
    summary: 'Introductory hand balance with knees supported on the arms.', standard: '20-second controlled hold.',
    prerequisites: ['wrist-prep'], leadsTo: ['tuck-planche', 'wall-handstand'], cues: ['Look slightly forward.', 'Grip the floor.'], commonMistakes: ['Looking straight down', 'Dumping weight into wrists']
  },
  {
    id: 'planche-lean', name: 'Planche Lean', category: 'push', difficulty: 'Intermediate', x: -300, y: 790,
    summary: 'Straight-arm lean that builds planche wrist and shoulder strength.', standard: '20 seconds with protracted shoulders.',
    prerequisites: ['pseudo-planche-push-up'], leadsTo: ['tuck-planche'], cues: ['Push tall through the shoulders.', 'Lean without bending elbows.'],
    commonMistakes: ['Bent elbows', 'Shoulders behind hands']
  },
  {
    id: 'tuck-planche', name: 'Tuck Planche', category: 'push', difficulty: 'Advanced', x: -150, y: 960,
    summary: 'Straight-arm planche with knees tucked close to the chest.', standard: '8-second hold with hips near shoulder height.',
    prerequisites: ['frog-stand', 'planche-lean'], leadsTo: ['advanced-tuck-planche'], cues: ['Round the upper back.', 'Push the floor away.'],
    commonMistakes: ['Bent elbows', 'Hips hanging low']
  },
  {
    id: 'advanced-tuck-planche', name: 'Advanced Tuck Planche', category: 'push', difficulty: 'Advanced', x: -100, y: 1130,
    summary: 'Open the hip angle while preserving straight-arm planche position.', standard: '8-second controlled hold.',
    prerequisites: ['tuck-planche'], leadsTo: ['straddle-planche'], cues: ['Keep knees behind elbows.', 'Maintain protraction.'], commonMistakes: ['Losing shoulder lean', 'Opening before control is ready']
  },
  {
    id: 'straddle-planche', name: 'Straddle Planche', category: 'push', difficulty: 'Elite', x: -100, y: 1300,
    summary: 'Full-body planche with the legs separated to reduce leverage.', standard: '5-second clean hold.',
    prerequisites: ['advanced-tuck-planche'], leadsTo: ['full-planche'], cues: ['Reach long through the toes.', 'Keep elbows locked.'], commonMistakes: ['Hips too high', 'Soft elbows']
  },
  {
    id: 'full-planche', name: 'Full Planche', category: 'push', difficulty: 'Elite', x: -100, y: 1470,
    summary: 'Horizontal straight-body support held only by the hands.', standard: '5-second clean hold.',
    prerequisites: ['straddle-planche'], leadsTo: [], cues: ['Protract hard.', 'Keep the body one rigid line.'], commonMistakes: ['Piked hips', 'Bent arms']
  },
  {
    id: 'wall-handstand', name: 'Wall Handstand', category: 'balance', difficulty: 'Beginner', x: 80, y: 570,
    summary: 'Use the wall to build upside-down alignment and confidence.', standard: '30 seconds chest-to-wall with straight elbows.',
    prerequisites: ['wrist-prep', 'shoulder-flexion', 'frog-stand'], leadsTo: ['handstand'], cues: ['Push the floor away.', 'Stack hips over shoulders.'],
    commonMistakes: ['Large back arch', 'Looking too far forward'], analyzerExercise: 'handstand', cameraAngle: 'Side view'
  },
  {
    id: 'handstand', name: 'Freestanding Handstand', category: 'balance', difficulty: 'Intermediate', x: 80, y: 760,
    summary: 'Balance upside down with a controlled stacked body line.', standard: '10-second freestanding hold.',
    prerequisites: ['wall-handstand'], leadsTo: ['handstand-push-up', 'press-handstand'], cues: ['Use fingertips to control overbalance.', 'Stay tall through shoulders.'],
    commonMistakes: ['Banana back', 'Bent elbows'], analyzerExercise: 'handstand', cameraAngle: 'Side view'
  },
  {
    id: 'pike-push-up', name: 'Pike Push-up', category: 'push', difficulty: 'Intermediate', x: -690, y: 900,
    summary: 'Vertical pressing progression toward handstand push-ups.', standard: '10 reps with head traveling forward and down.',
    prerequisites: ['push-up'], leadsTo: ['wall-hspu'], cues: ['Keep hips high.', 'Make a tripod with head and hands.'], commonMistakes: ['Turning it into a normal push-up', 'Elbows flaring wide']
  },
  {
    id: 'wall-hspu', name: 'Wall Handstand Push-up', category: 'push', difficulty: 'Advanced', x: -520, y: 1060,
    summary: 'Vertical press through full range while supported by a wall.', standard: '5 controlled reps.',
    prerequisites: ['pike-push-up', 'wall-handstand'], leadsTo: ['handstand-push-up'], cues: ['Descend between the hands.', 'Finish with elevated shoulders.'],
    commonMistakes: ['Shallow range', 'Losing the stack']
  },
  {
    id: 'handstand-push-up', name: 'Freestanding HSPU', category: 'push', difficulty: 'Elite', x: -420, y: 1240,
    summary: 'A freestanding handstand push-up with balance and full control.', standard: 'One controlled full-range rep.',
    prerequisites: ['wall-hspu', 'handstand'], leadsTo: [], cues: ['Control the descent.', 'Keep the center over the hands.'], commonMistakes: ['Falling through the bottom', 'Excessive arch']
  },
  {
    id: 'tuck-lsit', name: 'Tuck L-sit', category: 'core', difficulty: 'Beginner', x: 120, y: 430,
    summary: 'Supported compression hold with knees tucked.', standard: '20-second hold with shoulders depressed.',
    prerequisites: ['hollow-hold'], leadsTo: ['one-leg-lsit'], cues: ['Push down through the hands.', 'Lift knees toward chest.'], commonMistakes: ['Shrugging', 'Resting on bent arms']
  },
  {
    id: 'one-leg-lsit', name: 'One-leg L-sit', category: 'core', difficulty: 'Intermediate', x: 130, y: 610,
    summary: 'Extend one leg while keeping the other tucked.', standard: '10 seconds per side.',
    prerequisites: ['tuck-lsit'], leadsTo: ['lsit'], cues: ['Keep both knees high.', 'Point the extended leg long.'], commonMistakes: ['Leaning far back', 'Soft support arms']
  },
  {
    id: 'lsit', name: 'L-sit', category: 'core', difficulty: 'Intermediate', x: 150, y: 800,
    summary: 'Support the body with both legs straight and horizontal.', standard: '15-second clean hold.',
    prerequisites: ['one-leg-lsit'], leadsTo: ['vsit', 'press-handstand'], cues: ['Push tall.', 'Compress thighs toward chest.'], commonMistakes: ['Bent knees', 'Hips behind hands']
  },
  {
    id: 'vsit', name: 'V-sit', category: 'core', difficulty: 'Advanced', x: 160, y: 1010,
    summary: 'Raise straight legs above horizontal while supporting on the hands.', standard: '8-second controlled hold.',
    prerequisites: ['lsit'], leadsTo: ['manna'], cues: ['Drive hips forward.', 'Compress actively.'], commonMistakes: ['Relying only on hamstring flexibility', 'Bent knees']
  },
  {
    id: 'manna', name: 'Manna', category: 'core', difficulty: 'Elite', x: 160, y: 1220,
    summary: 'Extreme compression and shoulder extension with hips lifted high.', standard: '3-second recognizable hold.',
    prerequisites: ['vsit'], leadsTo: [], cues: ['Push hips forward and upward.', 'Keep arms straight.'], commonMistakes: ['Forcing shoulder range', 'Losing knee extension']
  },
  {
    id: 'front-lever-tuck', name: 'Tuck Front Lever', category: 'pull', difficulty: 'Intermediate', x: 420, y: 620,
    summary: 'Horizontal pulling hold with knees tucked.', standard: '10-second hold with hips level to shoulders.',
    prerequisites: ['active-hang', 'scap-pull', 'hollow-hold'], leadsTo: ['front-lever-advanced-tuck'], cues: ['Pull the bar toward your hips.', 'Keep arms straight.'],
    commonMistakes: ['Hips too low', 'Bent elbows'], analyzerExercise: 'front-lever', cameraAngle: 'Side view'
  },
  {
    id: 'front-lever-advanced-tuck', name: 'Advanced Tuck Front Lever', category: 'pull', difficulty: 'Advanced', x: 430, y: 820,
    summary: 'Open the hip angle while maintaining a horizontal torso.', standard: '8-second hold.',
    prerequisites: ['front-lever-tuck'], leadsTo: ['front-lever-one-leg'], cues: ['Keep hips open.', 'Maintain scapular depression.'], commonMistakes: ['Rounding into a tight tuck', 'Dropping hips']
  },
  {
    id: 'front-lever-one-leg', name: 'One-leg Front Lever', category: 'pull', difficulty: 'Advanced', x: 450, y: 1010,
    summary: 'Extend one leg to lengthen the lever while the other stays tucked.', standard: '6 seconds per side.',
    prerequisites: ['front-lever-advanced-tuck'], leadsTo: ['front-lever-straddle'], cues: ['Keep hips square.', 'Reach through the extended heel.'], commonMistakes: ['Twisting', 'Bending the extended knee']
  },
  {
    id: 'front-lever-straddle', name: 'Straddle Front Lever', category: 'pull', difficulty: 'Elite', x: 480, y: 1200,
    summary: 'Horizontal front lever with legs separated.', standard: '5-second hold.',
    prerequisites: ['front-lever-one-leg'], leadsTo: ['front-lever-full'], cues: ['Keep hips fully open.', 'Pull straight arms toward the hips.'], commonMistakes: ['Piked hips', 'Soft elbows'],
    analyzerExercise: 'front-lever', cameraAngle: 'Side view'
  },
  {
    id: 'front-lever-full', name: 'Full Front Lever', category: 'pull', difficulty: 'Elite', x: 500, y: 1390,
    summary: 'Horizontal straight-body hang with locked elbows.', standard: '5-second clean hold.',
    prerequisites: ['front-lever-straddle'], leadsTo: [], cues: ['Stay hollow.', 'Keep the bar pulled toward the hips.'], commonMistakes: ['Hips below shoulders', 'Bent elbows'],
    analyzerExercise: 'front-lever', cameraAngle: 'Side view'
  },
  {
    id: 'skin-the-cat', name: 'Skin the Cat', category: 'pull', difficulty: 'Intermediate', x: 850, y: 520,
    summary: 'Controlled rotation through an inverted hang into shoulder extension.', standard: '3 smooth reps within comfortable range.',
    prerequisites: ['active-hang'], leadsTo: ['tuck-back-lever'], cues: ['Move slowly.', 'Stay within pain-free shoulder range.'], commonMistakes: ['Dropping into the bottom', 'Forcing shoulder extension']
  },
  {
    id: 'tuck-back-lever', name: 'Tuck Back Lever', category: 'pull', difficulty: 'Intermediate', x: 920, y: 720,
    summary: 'Horizontal back-facing hold with knees tucked.', standard: '10-second controlled hold.',
    prerequisites: ['skin-the-cat'], leadsTo: ['advanced-tuck-back-lever'], cues: ['Keep elbows locked.', 'Squeeze the glutes.'], commonMistakes: ['Bent elbows', 'Opening shoulders too aggressively']
  },
  {
    id: 'advanced-tuck-back-lever', name: 'Advanced Tuck Back Lever', category: 'pull', difficulty: 'Advanced', x: 940, y: 920,
    summary: 'Open the hips while maintaining the back lever line.', standard: '8-second hold.',
    prerequisites: ['tuck-back-lever'], leadsTo: ['straddle-back-lever'], cues: ['Keep shoulders stable.', 'Open gradually.'], commonMistakes: ['Hips dropping', 'Rushing progression']
  },
  {
    id: 'straddle-back-lever', name: 'Straddle Back Lever', category: 'pull', difficulty: 'Advanced', x: 960, y: 1110,
    summary: 'Back lever with the legs separated.', standard: '5-second hold.',
    prerequisites: ['advanced-tuck-back-lever'], leadsTo: ['full-back-lever'], cues: ['Reach long through both feet.', 'Maintain straight elbows.'], commonMistakes: ['Uneven leg position', 'Shoulder discomfort ignored']
  },
  {
    id: 'full-back-lever', name: 'Full Back Lever', category: 'pull', difficulty: 'Elite', x: 970, y: 1300,
    summary: 'Straight-body horizontal hold facing the floor.', standard: '5-second clean hold.',
    prerequisites: ['straddle-back-lever'], leadsTo: [], cues: ['Squeeze glutes and quads.', 'Keep arms locked.'], commonMistakes: ['Hips folding', 'Bent elbows']
  },
  {
    id: 'split-squat', name: 'Split Squat', category: 'legs', difficulty: 'Beginner', x: 780, y: 370,
    summary: 'Single-leg dominant strength with both feet supported.', standard: '12 controlled reps per side.',
    prerequisites: ['bodyweight-squat'], leadsTo: ['assisted-pistol'], cues: ['Drop straight down.', 'Keep front foot planted.'], commonMistakes: ['Pushing only from back leg', 'Losing balance']
  },
  {
    id: 'assisted-pistol', name: 'Assisted Pistol Squat', category: 'legs', difficulty: 'Intermediate', x: 790, y: 570,
    summary: 'Use light support to learn single-leg squat depth and balance.', standard: '8 reps per side with minimal assistance.',
    prerequisites: ['split-squat'], leadsTo: ['pistol-squat'], cues: ['Use assistance only as needed.', 'Control the bottom.'], commonMistakes: ['Pulling heavily with the arms', 'Collapsing inward']
  },
  {
    id: 'pistol-squat', name: 'Pistol Squat', category: 'legs', difficulty: 'Advanced', x: 790, y: 780,
    summary: 'Full-range single-leg squat with the other leg extended.', standard: '5 controlled reps per side.',
    prerequisites: ['assisted-pistol'], leadsTo: ['shrimp-squat'], cues: ['Keep the heel planted.', 'Reach the free leg forward.'], commonMistakes: ['Dropping into the bottom', 'Heel lifting']
  },
  {
    id: 'shrimp-squat', name: 'Advanced Shrimp Squat', category: 'legs', difficulty: 'Advanced', x: 790, y: 990,
    summary: 'Deep single-leg squat with the rear foot held behind.', standard: '5 controlled reps per side.',
    prerequisites: ['pistol-squat'], leadsTo: [], cues: ['Stay tall.', 'Lower the rear knee gently.'], commonMistakes: ['Crashing the rear knee', 'Losing foot pressure']
  },
  {
    id: 'pike-flexibility', name: 'Pike Flexibility', category: 'mobility', difficulty: 'Beginner', x: -690, y: 240,
    summary: 'Hamstring and posterior-chain range used in compression skills.', standard: 'Comfortably reach past the toes with a long spine.',
    prerequisites: [], leadsTo: ['lsit', 'press-handstand'], cues: ['Fold from the hips.', 'Use relaxed breathing.'], commonMistakes: ['Forcing the knees straight', 'Bouncing']
  },
  {
    id: 'press-handstand', name: 'Press to Handstand', category: 'balance', difficulty: 'Elite', x: 40, y: 1050,
    summary: 'Lift into a handstand without jumping using compression and shoulder strength.', standard: 'One controlled press from a straddle or pike.',
    prerequisites: ['handstand', 'lsit', 'pike-flexibility'], leadsTo: [], cues: ['Shift shoulders before lifting feet.', 'Compress hard.'], commonMistakes: ['Jumping', 'Opening the hips too early']
  },
  {
    id: 'one-arm-push-up', name: 'One-arm Push-up', category: 'push', difficulty: 'Advanced', x: -650, y: 880,
    summary: 'Horizontal press using one arm while resisting rotation.', standard: '3 clean reps per side.',
    prerequisites: ['archer-push-up'], leadsTo: [], cues: ['Widen feet as needed.', 'Keep shoulders and hips turning together.'], commonMistakes: ['Twisting excessively', 'Partial depth']
  },
  {
    id: 'archer-pull-up', name: 'Archer Pull-up', category: 'pull', difficulty: 'Advanced', x: 640, y: 990,
    summary: 'Shift most of the pull toward one arm.', standard: '4 controlled reps per side.',
    prerequisites: ['pull-up'], leadsTo: ['one-arm-pull-up'], cues: ['Pull toward the working hand.', 'Keep the other arm long.'], commonMistakes: ['Uneven range', 'Swinging']
  },
  {
    id: 'one-arm-pull-up', name: 'One-arm Pull-up', category: 'pull', difficulty: 'Elite', x: 660, y: 1200,
    summary: 'Vertical pull from one arm without assistance.', standard: 'One full controlled rep per side.',
    prerequisites: ['archer-pull-up'], leadsTo: [], cues: ['Start from an active shoulder.', 'Keep the torso controlled.'], commonMistakes: ['Jumping into the rep', 'Short range']
  }
]

export const skillLinks: SkillLink[] = skills.flatMap((skill) =>
  skill.prerequisites.map((source) => ({ source, target: skill.id }))
)

export const skillById = new Map(skills.map((skill) => [skill.id, skill]))
