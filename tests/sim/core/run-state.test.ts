import test from "node:test";
import assert from "node:assert/strict";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import { createSim } from "@vs-engine/runtime/src/sim/core/Sim";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";

test("pause prevents gameplay systems from executing", () => {
  const sim = createSim();
  sim.resetRun(999);
  sim.step(1 / 60);
  sim.setRunState(RunState.Paused);

  const before = sim.getDebugSnapshot();
  sim.step(1 / 60);
  const after = sim.getDebugSnapshot();

  assert.equal(after.tick, before.tick + 1);
  assert.equal(after.gameplayTicks, before.gameplayTicks);
  assert.equal(
    after.systems.PlayerMovementSystem.skippedTicks,
    before.systems.PlayerMovementSystem.skippedTicks + 1,
  );
  assert.equal(after.systems.RunStateSystem.executedTicks, before.systems.RunStateSystem.executedTicks + 1);
  assert.equal(after.counters.elapsedSeconds, before.counters.elapsedSeconds);
});

test("level-up and pause do not advance elapsed sim time while waiting", () => {
  const sim = createSim({}, loadPrototypeContentRegistry());
  sim.resetRun(42);
  sim.step(1 / 60);

  const beforePause = sim.getDebugSnapshot();
  sim.setRunState(RunState.Paused);
  for (let index = 0; index < 180; index += 1) {
    sim.step(1 / 60);
  }

  const afterPause = sim.getDebugSnapshot();
  assert.equal(afterPause.counters.elapsedSeconds, beforePause.counters.elapsedSeconds);

  sim.setRunState(RunState.LevelUpChoice);
  for (let index = 0; index < 180; index += 1) {
    sim.step(1 / 60);
  }

  const afterLevelUp = sim.getDebugSnapshot();
  assert.equal(afterLevelUp.counters.elapsedSeconds, beforePause.counters.elapsedSeconds);
});

test("reset clears transient world state and queues", () => {
  const sim = createSim({}, loadPrototypeContentRegistry());
  sim.resetRun(42);
  sim.step(1 / 60, {
    moveX: 1,
    moveY: 0,
    pausePressed: false,
    confirmPressed: false,
    cancelPressed: false,
    debugGrantXpPressed: true,
    debugSpawnWavePressed: true,
  });

  const dirtyState = sim.getDebugSnapshot();
  assert.ok(dirtyState.activeEnemyCount >= 1);
  assert.equal(dirtyState.queueSizes.xpGrant, 0);
  assert.equal(dirtyState.tick, 1);
  assert.equal(sim.getRenderSnapshot().progression.xp, 1);

  sim.resetRun(77);

  const cleanState = sim.getDebugSnapshot();
  assert.equal(cleanState.tick, 0);
  assert.equal(cleanState.gameplayTicks, 0);
  assert.equal(cleanState.queueSizes.enemySpawn, 0);
  assert.equal(cleanState.queueSizes.xpGrant, 0);
  assert.equal(cleanState.runState, RunState.StartingRun);
  assert.equal(cleanState.playerInvulnerable, false);
});

test("debug input can toggle invulnerability and spawn ten enemies", () => {
  const sim = createSim({}, loadPrototypeContentRegistry());
  sim.resetRun(42);

  sim.step(1 / 60, {
    moveX: 0,
    moveY: 0,
    pausePressed: false,
    confirmPressed: false,
    cancelPressed: false,
    debugToggleInvulnerablePressed: true,
  });

  let debugState = sim.getDebugSnapshot();
  assert.equal(debugState.playerInvulnerable, true);

  sim.step(1 / 60, {
    moveX: 0,
    moveY: 0,
    pausePressed: false,
    confirmPressed: false,
    cancelPressed: false,
    debugSpawnWavePressed: true,
  });

  debugState = sim.getDebugSnapshot();
  assert.equal(debugState.activeEnemyCount - 4, 10);

  const snapshot = sim.getRenderSnapshot();
  const debugSpawnTypeIds = new Set<number>();
  for (let index = 4; index < snapshot.enemies.activeCount; index += 1) {
    debugSpawnTypeIds.add(snapshot.enemies.typeIds[index] ?? -1);
  }
  assert.equal(debugSpawnTypeIds.size > 1, true);
});
