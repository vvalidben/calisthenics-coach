import type { FamilyInfo, Pathway } from '../domain/family';
import { PATHWAYS } from '../domain/family';
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
    pathway: 'push',
    name: 'Push',
    category: 'push',
    goal: 'Press your full bodyweight cleanly, then make it harder by shifting the load.',
    requiresEquipment: [],
  },
  {
    id: 'dip',
    pathway: 'push',
    name: 'Dip',
    category: 'push',
    goal: 'Build the vertical press from a chair up to a full dip.',
    requiresEquipment: ['chair'],
  },
  {
    id: 'pull-prep',
    pathway: 'pull',
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
    pathway: 'pull',
    name: 'Pull',
    category: 'pull',
    goal: 'Hang, then row, then pull your own bodyweight over the bar.',
    requiresEquipment: ['pullup-bar'],
    caveat: 'Locked until you fit a pull-up bar. Every step below is ready for the day you do.',
  },
  {
    id: 'squat',
    pathway: 'legs',
    name: 'Squat',
    category: 'legs',
    goal: 'Progress from two legs to one, ending at a full pistol squat.',
    requiresEquipment: [],
  },
  {
    id: 'hinge',
    pathway: 'legs',
    name: 'Hinge',
    category: 'legs',
    goal: 'Train the glutes and hamstrings, which squats alone leave under-worked.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'core',
    pathway: 'core',
    name: 'Core',
    category: 'core',
    goal: 'Hold a straight line under increasing leverage, from dead bug to hollow rock.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'side-core',
    pathway: 'core',
    name: 'Side core',
    category: 'core',
    goal: 'Resist sideways collapse, which the front plank never trains.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'hanging-core',
    pathway: 'core',
    name: 'Hanging core',
    category: 'core',
    goal: 'Trunk flexion under a hang, which also builds grip and shoulder stability.',
    requiresEquipment: ['pullup-bar'],
    caveat: 'Locked until you fit a pull-up bar. The floor core family covers this meanwhile.',
  },
  {
    id: 'handstand',
    pathway: 'skill',
    name: 'Handstand',
    category: 'skill',
    goal: 'Hold an inverted position, working toward a free-standing handstand.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'shoulder-mobility',
    pathway: 'mobility',
    name: 'Shoulders',
    category: 'mobility',
    goal: 'Reach fully overhead without arching the lower back.',
    requiresEquipment: ['wall'],
  },
  {
    id: 'thoracic-mobility',
    pathway: 'mobility',
    name: 'Thoracic spine',
    category: 'mobility',
    goal: 'Move and rotate the upper back instead of borrowing range from the lower back.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'hip-mobility',
    pathway: 'mobility',
    name: 'Hips',
    category: 'mobility',
    goal: 'Rest comfortably in a deep squat and rotate freely in both directions.',
    requiresEquipment: ['floor'],
  },
  {
    id: 'hamstring-mobility',
    pathway: 'mobility',
    name: 'Hamstrings',
    category: 'mobility',
    goal: 'Fold at the hip with a long spine rather than rounding the back.',
    requiresEquipment: [],
  },
  {
    id: 'ankle-mobility',
    pathway: 'mobility',
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

/**
 * The movement patterns the families group under.
 *
 * A pathway is not a single ladder. Core holds three of them because resisting
 * extension, resisting sideways collapse and flexing under a hang are different
 * qualities, and collapsing them into one chain would mean abandoning the front
 * plank the moment you start side planks.
 */
export interface PathwayInfo {
  id: Pathway;
  name: string;
  summary: string;
  /** Shown above the ladders where the pathway needs a caveat of its own. */
  note?: string;
}

export const PATHWAY_INFO: PathwayInfo[] = [
  {
    id: 'push',
    name: 'Push',
    summary: 'Pressing your bodyweight away from you, horizontally and vertically.',
  },
  {
    id: 'legs',
    name: 'Legs',
    summary: 'Squatting on two legs, then one, plus the hinge work squats leave out.',
  },
  {
    id: 'core',
    name: 'Core',
    summary: 'Three separate qualities: resisting extension, resisting sideways collapse, and flexing under a hang.',
    note:
      'These are parallel ladders, not one chain. Starting side planks does not mean stopping front planks '
      + '— they train different things and both keep running.',
  },
  {
    id: 'pull',
    name: 'Pull',
    summary: 'The one pattern you cannot train properly without equipment.',
    note:
      'Meaningful vertical pulling needs something safe to hang from. There is no substitute: lying on the '
      + 'floor and lifting your arms loads the weight of your arms, not your bodyweight, and no amount of it '
      + 'will build a pull-up. Nothing improvised is worth it either — a bar across two chairs, a towel '
      + 'on a door handle or a loaded door frame can fail under load, and the fall lands on your head and '
      + 'neck. Fit a proper bar and the entire ladder below unlocks at once.',
  },
  {
    id: 'skill',
    name: 'Skill',
    summary: 'Long-term work that does not belong inside a 26-minute session.',
    note:
      'The handstand is deliberately not in your programme. It is a skill built over years, in short frequent '
      + 'practice on fresh shoulders — train it on a rest day or after a session, a stage at a time.',
  },
  {
    id: 'mobility',
    name: 'Mobility',
    summary: 'Five areas, each with its own short ladder.',
  },
];

const PATHWAY_ORDER = new Map(PATHWAYS.map((id, index) => [id, index]));

/** Families grouped under their pathway, both in display order. */
export const familiesByPathway = (): { pathway: PathwayInfo; families: FamilyInfo[] }[] =>
  [...PATHWAY_INFO]
    .sort((a, b) => (PATHWAY_ORDER.get(a.id) ?? 0) - (PATHWAY_ORDER.get(b.id) ?? 0))
    .map((pathway) => ({
      pathway,
      families: FAMILY_INFO.filter((family) => family.pathway === pathway.id),
    }));
