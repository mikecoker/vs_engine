import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { stepHealthPickupSpawner } from "@vs-engine/runtime/src/sim/pickups/HealthPickupSpawnSystem";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

function createHealthSpawnContext() {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 27);
  const context = {
    dt: world.config.fixedStepSeconds,
    tick: 1,
    elapsedSeconds: world.scratch.nextHealthPickupSpawnAtSeconds,
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

  world.time.elapsedSeconds = world.scratch.nextHealthPickupSpawnAtSeconds;
  world.stores.player.exists = true;
  world.stores.player.posX = 32;
  world.stores.player.posY = -48;

  return { world, context };
}

test("health pickup spawner places pickups near the player", () => {
  const { world, context } = createHealthSpawnContext();

  stepHealthPickupSpawner(context);

  assert.equal(world.commands.pickupSpawn.count, 1);
  const command = world.commands.pickupSpawn.get(0);
  const dx = command.x - world.stores.player.posX;
  const dy = command.y - world.stores.player.posY;
  const distance = Math.hypot(dx, dy);

  assert.equal(distance >= 150, true);
  assert.equal(distance <= 260, true);
});
