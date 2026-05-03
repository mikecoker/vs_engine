import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import {
  PICKUP_MAGNET_DURATION_SECONDS,
  stepPickupMagnetSystem,
} from "@vs-engine/runtime/src/sim/pickups/PickupMagnetSystem";
import { stepPickupCollectSystem } from "@vs-engine/runtime/src/sim/pickups/PickupCollectSystem";
import { applyPickupSpawnCommands } from "@vs-engine/runtime/src/sim/pickups/PickupSpawnSystem";
import { ensurePickupStore } from "@vs-engine/runtime/src/sim/pickups/PickupStore";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

function createPickupContext() {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 17);
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

  world.stores.player.exists = true;
  world.stores.player.posX = 0;
  world.stores.player.posY = 0;
  world.stores.player.pickupRadius = 96;
  world.stores.player.radius = 12;

  return { world, context };
}

test("magnetized pickups reach the player within one second", () => {
  const { world, context } = createPickupContext();
  world.commands.pickupSpawn.enqueue(0, 90, 0, 8, 1);
  applyPickupSpawnCommands(context);

  const store = ensurePickupStore(world);
  const stepCount = Math.ceil(PICKUP_MAGNET_DURATION_SECONDS / context.dt);

  stepPickupMagnetSystem(context);

  for (let step = 0; step < stepCount; step += 1) {
    stepPickupMagnetSystem(context);
  }

  assert.equal(store.magnetized[0], 1);
  assert.ok(Math.abs(store.posX[0] - world.stores.player.posX) <= 0.001);
  assert.ok(Math.abs(store.posY[0] - world.stores.player.posY) <= 0.001);
  assert.ok(store.magnetTimeRemaining[0] <= 0.001);
});

test("magnetized pickups still catch a moving player within one second", () => {
  const { world, context } = createPickupContext();
  world.commands.pickupSpawn.enqueue(0, 90, 0, 8, 1);
  applyPickupSpawnCommands(context);

  const store = ensurePickupStore(world);
  const stepCount = Math.ceil(PICKUP_MAGNET_DURATION_SECONDS / context.dt);

  stepPickupMagnetSystem(context);
  assert.equal(store.magnetized[0], 1);

  for (let step = 0; step < stepCount; step += 1) {
    world.stores.player.posX += 10;
    stepPickupMagnetSystem(context);
  }

  assert.equal(store.magnetized[0], 1);
  assert.ok(Math.abs(store.posX[0] - world.stores.player.posX) <= 0.001);
  assert.ok(Math.abs(store.posY[0] - world.stores.player.posY) <= 0.001);
  assert.ok(store.magnetTimeRemaining[0] <= 0.001);
});

test("magnet pickup magnetizes all xp gems on the board", () => {
  const { world, context } = createPickupContext();
  world.commands.pickupSpawn.enqueue(0, 320, 40, 8, 1);
  world.commands.pickupSpawn.enqueue(1, -280, -60, 10, 8);
  world.commands.pickupSpawn.enqueue(4, 0, 0, 12, 0);
  applyPickupSpawnCommands(context);

  const store = ensurePickupStore(world);
  assert.equal(store.activeCount, 3);

  stepPickupCollectSystem(context);

  assert.equal(store.activeCount, 2);
  assert.equal(store.magnetized[0], 1);
  assert.equal(store.magnetized[1], 1);
  assert.ok(store.magnetTimeRemaining[0] > 0);
  assert.ok(store.magnetTimeRemaining[1] > 0);
});

test("heal pickups do not magnetize while player is full health", () => {
  const { world, context } = createPickupContext();
  world.stores.player.hp = 100;
  world.stores.player.maxHp = 100;
  world.commands.pickupSpawn.enqueue(3, 90, 0, 10, 12);
  applyPickupSpawnCommands(context);

  const store = ensurePickupStore(world);

  stepPickupMagnetSystem(context);

  assert.equal(store.magnetized[0], 0);
  assert.equal(store.posX[0], 90);
  assert.equal(store.posY[0], 0);
});

test("heal pickups magnetize once player can use healing", () => {
  const { world, context } = createPickupContext();
  world.stores.player.hp = 80;
  world.stores.player.maxHp = 100;
  world.commands.pickupSpawn.enqueue(3, 90, 0, 10, 12);
  applyPickupSpawnCommands(context);

  const store = ensurePickupStore(world);

  stepPickupMagnetSystem(context);

  assert.equal(store.magnetized[0], 1);
  assert.ok(store.posX[0] < 90);
});
