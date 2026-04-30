import assert from 'node:assert/strict';
import test from 'node:test';
import {
  enemyArchetypeId,
  playerCharacterId,
  weaponId,
} from '../../../src/sim/content/ContentIds';
import { loadPrototypeContentRegistry } from '../../../src/sim/content/ContentLoader';

test('prototype registry resolves starter definitions by durable ID', () => {
  const registry = loadPrototypeContentRegistry();

  const witch = registry.playerCharacters.get(playerCharacterId('player.witch'));
  const magicBolt = registry.weapons.get(weaponId('weapon.magic_bolt'));
  const bat = registry.enemyArchetypes.get(enemyArchetypeId('enemy.bat'));

  assert.equal(witch.displayName, 'Witch');
  assert.equal(magicBolt.behavior, 'projectile');
  assert.equal(bat.behavior, 'chase');
});

test('prototype registry exposes stable numeric indices for runtime stores', () => {
  const registry = loadPrototypeContentRegistry();

  assert.equal(
    registry.playerCharacters.getIndex(playerCharacterId('player.witch')),
    0,
  );
  assert.equal(registry.weapons.getIndex(weaponId('weapon.magic_bolt')), 0);
  assert.equal(
    registry.enemyArchetypes.getIndex(enemyArchetypeId('enemy.skeleton')),
    1,
  );
});
