import { describe, expect, it } from 'vitest';
import {
  availabilityOf,
  isExerciseAvailable,
  missingEquipmentFor,
} from './availability';
import { anExercise, aProfile } from '../test/factories';

const noEquipment = aProfile({
  availableEquipment: ['none', 'floor', 'wall', 'chair', 'towel'],
});

describe('missingEquipmentFor', () => {
  it('is empty when the athlete has everything the exercise needs', () => {
    const exercise = anExercise({ equipment: ['floor'] });
    expect(missingEquipmentFor(exercise, noEquipment)).toEqual([]);
  });

  it('names the equipment the athlete lacks', () => {
    const exercise = anExercise({ equipment: ['pullup-bar'] });
    expect(missingEquipmentFor(exercise, noEquipment)).toEqual(['pullup-bar']);
  });

  it('names every missing item, not just the first', () => {
    const exercise = anExercise({ equipment: ['floor', 'pullup-bar', 'parallel-bars'] });
    expect(missingEquipmentFor(exercise, noEquipment)).toEqual(['pullup-bar', 'parallel-bars']);
  });
});

describe('isExerciseAvailable', () => {
  it('is true when nothing is missing', () => {
    expect(isExerciseAvailable(anExercise({ equipment: ['wall'] }), noEquipment)).toBe(true);
  });

  it('is false when anything is missing', () => {
    expect(isExerciseAvailable(anExercise({ equipment: ['floor', 'pullup-bar'] }), noEquipment)).toBe(
      false,
    );
  });

  it('becomes true once the athlete acquires the equipment', () => {
    const exercise = anExercise({ equipment: ['pullup-bar'] });
    const withBar = aProfile({ availableEquipment: [...noEquipment.availableEquipment, 'pullup-bar'] });
    expect(isExerciseAvailable(exercise, withBar)).toBe(true);
  });
});

describe('availabilityOf', () => {
  it('reports an available exercise with no blocker', () => {
    expect(availabilityOf(anExercise({ equipment: ['floor'] }), noEquipment)).toEqual({
      available: true,
      missingEquipment: [],
    });
  });

  it('reports a blocked exercise with what would unblock it', () => {
    expect(availabilityOf(anExercise({ equipment: ['pullup-bar'] }), noEquipment)).toEqual({
      available: false,
      missingEquipment: ['pullup-bar'],
    });
  });
});
