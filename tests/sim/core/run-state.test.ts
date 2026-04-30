import test from "node:test";
import assert from "node:assert/strict";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { createSim } from "../../../src/sim/core/Sim";
import { RunState } from "../../../src/sim/core/RunState";

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
  assert.equal(dirtyState.queueSizes.xpGrant, 1);
  assert.equal(dirtyState.tick, 1);

  sim.resetRun(77);

  const cleanState = sim.getDebugSnapshot();
  assert.equal(cleanState.tick, 0);
  assert.equal(cleanState.gameplayTicks, 0);
  assert.equal(cleanState.queueSizes.enemySpawn, 0);
  assert.equal(cleanState.queueSizes.xpGrant, 0);
  assert.equal(cleanState.runState, RunState.StartingRun);
});
