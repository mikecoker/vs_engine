import test from 'node:test';
import assert from 'node:assert/strict';
import { DebugCommandQueue } from '../../../src/sim/debug/DebugCommands';
import { DebugCounters } from '../../../src/sim/debug/DebugCounters';
import { processDebugCommands } from '../../../src/sim/debug/DebugSystem';
import type { RunState } from '../../../src/sim/core/RunState';

function createWorldHarness() {
  const counters = new DebugCounters();
  const debugCommands = new DebugCommandQueue();
  let grantedXp = 0;
  let spawnedCount = 0;
  let killed = false;

  return {
    world: {
      counters,
      debugCommands,
      getActiveEnemyCount: () => 0,
      getActiveProjectileCount: () => 0,
      getActivePickupCount: () => 0,
      getPlayerInvulnerable: () => false,
      getRunState: (): RunState => 'running',
      getTick: () => 0,
      getSeed: () => 123,
      grantXp(amount: number) {
        grantedXp += amount;
      },
      spawnTestWave(count: number) {
        spawnedCount += count;
      },
      killAllEnemies() {
        killed = true;
      },
    },
    get grantedXp() {
      return grantedXp;
    },
    get spawnedCount() {
      return spawnedCount;
    },
    get killed() {
      return killed;
    },
  };
}

test('debug commands dispatch to the expected world hooks', () => {
  const harness = createWorldHarness();

  harness.world.debugCommands.enqueueGrantXp(25);
  harness.world.debugCommands.enqueueSpawnTestWave(12);
  harness.world.debugCommands.enqueueKillAllEnemies();

  processDebugCommands(harness.world);

  assert.equal(harness.grantedXp, 25);
  assert.equal(harness.spawnedCount, 12);
  assert.equal(harness.killed, true);
  assert.equal(harness.world.debugCommands.length, 0);
  assert.equal(harness.world.counters.spawnCommandsProcessed, 12);
});
