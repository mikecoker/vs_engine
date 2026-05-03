import assert from 'node:assert/strict';
import test from 'node:test';
import { weaponId } from '@vs-engine/runtime/src/sim/content/ContentIds';
import { prototypeContentBundle } from '@vs-engine/runtime/src/sim/content/defs/index';
import {
  ContentValidationError,
  validateContentBundle,
} from '@vs-engine/runtime/src/sim/content/ContentValidation';

test('validateContentBundle rejects duplicate IDs', () => {
  const duplicateBundle = {
    ...prototypeContentBundle,
    weapons: [
      ...prototypeContentBundle.weapons,
      {
        ...prototypeContentBundle.weapons[0],
      },
    ],
  };

  assert.throws(
    () => validateContentBundle(duplicateBundle),
    (error: unknown) =>
      error instanceof ContentValidationError &&
      error.message.includes('Duplicate content ID "weapon.magic_bolt"'),
  );
});

test('validateContentBundle rejects invalid cross-references', () => {
  const invalidBundle = {
    ...prototypeContentBundle,
    playerCharacters: prototypeContentBundle.playerCharacters.map((def, index) =>
      index === 0
        ? {
            ...def,
            starterWeaponIds: [weaponId('weapon.missing_weapon')],
          }
        : def,
    ),
  };

  assert.throws(
    () => validateContentBundle(invalidBundle),
    (error: unknown) =>
      error instanceof ContentValidationError &&
      error.message.includes('Unknown starter weapon "weapon.missing_weapon"'),
  );
});
