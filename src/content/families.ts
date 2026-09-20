import type { FamilyInfo } from '../domain/family';
import type { Family } from '../domain/primitives';

/**
 * Every progression family, in the order they are shown.
 *
 * Two of them require a pull-up bar the athlete does not own. They are here in
 * full rather than omitted: the content is real, tested and ready, and it
 * unlocks the day a bar is fitted. Nothing has to be rewritten then.
 */
export const FAMILY_INFO: FamilyInfo[] = [
  {
    id: 'push',
    name: 'Push',
    category: 'push',
    goal: 'Press your full bodyweight cleanly, then make it harder by shifting the load.',
    requiresEquipment: [],
  },
  {
    id: 'dip',
    name: 'Dip',
    category: 'push',
    goal: 'Build the vertical press from a chair up to a full dip.',
    requiresEquipment: ['chair'],
  },
  {
    id: 'pull-prep',
    name: 'Pulling (floor-based)',
    category: 'pull',
    goal: 'Keep the upper back and rear shoulders working while there is no bar.',
    requiresEquipment: ['floor'],
    caveat:
      'These are not pulling exercises. Without something to hang from you cannot load a pull, '
      + 'so these train the shoulder blades and rear shoulders against gravity and nothing more. '
      + 'They maintain posture and shoulder health; they will not build a pull-up. A bar is the '
      + 'only honest fix.',
  },
  {
    id: 'pull',
    name: 'Pull',
    category: 'pull',
    goal: 'Hang, then row, then pull your own bodyweight over the bar.',
    requiresEquipment: ['pullup-bar'],
    caveat:
      'Locked until you fit a pull-up bar. Nothing improvised substitutes for this: a bar across '
      + 'two chairs, a towel on a door handle or a loaded door frame can fail under load, and the '
      + 'fall lands on your head and neck.',
  },
  {
    id: 'squat',
    name: 'Squat',
    category: 'legs',
    goal: 'Progress from two legs to one, ending at a full pistol squat.',
    requiresEquipment: [],
  },
  {
    id: 'hinge',
    name: 'Hinge',
    category: 'legs',
    goal: 'Train the glutes and hamstrings, which squats alone leave under-worked.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'core',
    name: 'Core',
    category: 'core',
    goal: 'Hold a straight line under increasing leverage, from dead bug to hollow rock.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'side-core',
    name: 'Side core',
    category: 'core',
    goal: 'Resist sideways collapse, which the front plank never trains.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'hanging-core',
    name: 'Hanging core',
    category: 'core',
    goal: 'Trunk flexion under a hang, which also builds grip and shoulder stability.',
    requiresEquipment: ['pullup-bar'],
    caveat: 'Locked until you fit a pull-up bar. The floor core family covers this meanwhile.',
  },
  {
    id: 'handstand',
    name: 'Handstand',
    category: 'skill',
    goal: 'Hold an inverted position, working toward a free-standing handstand.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'shoulder-mobility',
    name: 'Shoulders',
    category: 'mobility',
    goal: 'Reach fully overhead without arching the lower back.',
    requiresEquipment: ['wall'],
  },
  {
    id: 'thoracic-mobility',
    name: 'Thoracic spine',
    category: 'mobility',
    goal: 'Move and rotate the upper back instead of borrowing range from the lower back.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'hip-mobility',
    name: 'Hips',
    category: 'mobility',
    goal: 'Rest comfortably in a deep squat and rotate freely in both directions.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'hamstring-mobility',
    name: 'Hamstrings',
    category: 'mobility',
    goal: 'Fold at the hip with a long spine rather than rounding the back.',
    requiresEquipment: [],
  },
  {
    id: 'ankle-mobility',
    name: 'Ankles',
    category: 'mobility',
    goal: 'Let the knee travel over the toes, which every squat depth depends on.',
    requiresEquipment: ['floor'],
  },
];

const BY_ID = new Map(FAMILY_INFO.map((f) => [f.id, f]));

export const familyInfo = (family: Family): FamilyInfo | undefined => BY_ID.get(family);

export const requireFamilyInfo = (family: Family): FamilyInfo => {
  const info = BY_ID.get(family);
  if (!info) throw new Error(`Unknown family: ${family}`);
  return info;
};
