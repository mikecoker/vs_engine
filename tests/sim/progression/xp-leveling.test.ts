import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { applyPickupSpawnCommands } from "@vs-engine/runtime/src/sim/pickups/PickupSpawnSystem";
import { stepPickupCollectSystem } from "@vs-engine/runtime/src/sim/pickups/PickupCollectSystem";
import { stepProgression } from "@vs-engine/runtime/src/sim/progression/ProgressionSystem";
import { ensureProgressionStore } from "@vs-engine/runtime/src/sim/progression/ProgressionStore";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

function createProgressionContext() {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 11);
  const context = {
    dt: world.config.fixedStepSeconds,
    tick: 1,
    elapsedSeconds: 0,
    frameInput: {
      moveX: 0,
      moveY: 0,
      pausePressed: false,
      confirmPressed: false,
      cancelPressed: false,
    },
    config: world.config,
    world,
  } as FrameContext;

  return { world, context };
}

test("xp grants cross thresholds and queue a level-up", () => {
  const { world, context } = createProgressionContext();
  world.commands.xpGrant.enqueue(5);

  stepProgression(context);

  const progression = ensureProgressionStore(world);
  assert.equal(progression.level, 2);
  assert.equal(progression.xp, 0);
  assert.equal(progression.xpToNext, 12);
  assert.equal(progression.queuedLevelUps, 1);
  assert.equal(progression.currentChoices.length, 3);
  assert.equal(world.commands.stateChange.count, 1);
  assert.equal(world.commands.stateChange.get(0).nextState, RunState.LevelUpChoice);
});

test("multiple level gains in one batch queue correctly", () => {
  const { world, context } = createProgressionContext();
  world.commands.xpGrant.enqueue(20);

  stepProgression(context);

  const progression = ensureProgressionStore(world);
  assert.equal(progression.level, 3);
  assert.equal(progression.xp, 3);
  assert.equal(progression.xpToNext, 20);
  assert.equal(progression.queuedLevelUps, 2);
});

test("xp pickups enter the pickup runtime and grant XP on collection", () => {
  const { world, context } = createProgressionContext();
  world.commands.pickupSpawn.enqueue(0, 4, 6, 8, 3);

  applyPickupSpawnCommands(context);
  assert.equal(world.stores.pickups.activeCount, 1);

  world.stores.player.exists = true;
  world.stores.player.posX = 4;
  world.stores.player.posY = 6;

  stepPickupCollectSystem(context);
  stepProgression(context);

  const progression = ensureProgressionStore(world);
  assert.equal(progression.xp, 3);
  assert.equal(world.stores.pickups.activeCount, 0);
  assert.equal(world.commands.pickupSpawn.count, 0);
});

test("heal pickups restore hp on collection", () => {
  const { world, context } = createProgressionContext();
  world.commands.pickupSpawn.enqueue(3, 4, 6, 10, 12);

  applyPickupSpawnCommands(context);
  world.stores.player.exists = true;
  world.stores.player.posX = 4;
  world.stores.player.posY = 6;
  world.stores.player.hp = 50;
  world.stores.player.maxHp = 100;

  stepPickupCollectSystem(context);

  assert.equal(world.stores.player.hp, 62);
  assert.equal(world.stores.pickups.activeCount, 0);
});

test("heal pickups remain active when player is already at max hp", () => {
  const { world, context } = createProgressionContext();
  world.commands.pickupSpawn.enqueue(3, 4, 6, 10, 12);

  applyPickupSpawnCommands(context);
  world.stores.player.exists = true;
  world.stores.player.posX = 4;
  world.stores.player.posY = 6;
  world.stores.player.hp = 100;
  world.stores.player.maxHp = 100;

  stepPickupCollectSystem(context);

  assert.equal(world.stores.player.hp, 100);
  assert.equal(world.stores.pickups.activeCount, 1);
});
