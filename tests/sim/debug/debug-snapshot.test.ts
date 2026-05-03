import test from 'node:test';
import assert from 'node:assert/strict';
import { DebugCommandQueue } from '@vs-engine/runtime/src/sim/debug/DebugCommands';
import { DebugCounters } from '@vs-engine/runtime/src/sim/debug/DebugCounters';
import { collectDebugSnapshot, syncDebugCounters } from '@vs-engine/runtime/src/sim/debug/DebugSystem';
import type { RunState } from '@vs-engine/runtime/src/sim/core/RunState';

test('debug counters track tick, frame, and active-count state', () => {
  const counters = new DebugCounters();

  counters.beginFrame(1 / 60);
  counters.recordTick(1 / 60);
  counters.recordDamageRequests(4);
  counters.recordSpawnCommands(2);
  counters.setActiveCounts(10, 5, 3);

  assert.deepEqual(counters.snapshot(), {
    activeEnemies: 10,
    activeProjectiles: 5,
    activePickups: 3,
    damageRequestsProcessed: 4,
    spawnCommandsProcessed: 2,
    ticksStepped: 1,
    elapsedSeconds: 1 / 60,
    lastFrameSeconds: 1 / 60,
  });
});

test('debug snapshot collects active counts from world hooks', () => {
  const counters = new DebugCounters();
  const world = {
    counters,
    debugCommands: new DebugCommandQueue(),
    getActiveEnemyCount: () => 7,
    getActiveProjectileCount: () => 11,
    getActivePickupCount: () => 2,
    getPlayerInvulnerable: () => true,
    getRunState: (): RunState => 'paused',
    getTick: () => 42,
    getSeed: () => 99,
    grantXp() {},
    spawnTestWave() {},
    killAllEnemies() {},
  };

  syncDebugCounters(world);
  const snapshot = collectDebugSnapshot(world);

  assert.equal(snapshot.runState, 'paused');
  assert.equal(snapshot.tick, 42);
  assert.equal(snapshot.seed, 99);
  assert.equal(snapshot.playerInvulnerable, true);
  assert.deepEqual(snapshot.counters, {
    activeEnemies: 7,
    activeProjectiles: 11,
    activePickups: 2,
    damageRequestsProcessed: 0,
    spawnCommandsProcessed: 0,
    ticksStepped: 0,
    elapsedSeconds: 0,
    lastFrameSeconds: 0,
  });
});
