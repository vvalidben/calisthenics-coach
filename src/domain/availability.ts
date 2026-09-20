import type { Exercise } from './exercise';
import type { Equipment } from './primitives';
import type { UserProfile } from './profile';

/**
 * Whether the athlete can actually perform an exercise today, and if not, what
 * would change that.
 *
 * This is deliberately separate from ability. An ability is a fact about the
 * athlete ("7 clean pull-ups"); availability is a fact about their equipment.
 * Losing access to a bar does not erase the ability, and the catalog keeps
 * bar work as real, fully specified content that unlocks the day equipment
 * arrives.
 */
export interface Availability {
  available: boolean;
  missingEquipment: Equipment[];
}

export const missingEquipmentFor = (
  exercise: Pick<Exercise, 'equipment'>,
  profile: Pick<UserProfile, 'availableEquipment'>,
): Equipment[] => {
  const owned = new Set(profile.availableEquipment);
  return exercise.equipment.filter((item) => !owned.has(item));
};

export const isExerciseAvailable = (
  exercise: Pick<Exercise, 'equipment'>,
  profile: Pick<UserProfile, 'availableEquipment'>,
): boolean => missingEquipmentFor(exercise, profile).length === 0;

export const availabilityOf = (
  exercise: Pick<Exercise, 'equipment'>,
  profile: Pick<UserProfile, 'availableEquipment'>,
): Availability => {
  const missingEquipment = missingEquipmentFor(exercise, profile);
  return { available: missingEquipment.length === 0, missingEquipment };
};
