import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { stepProjectileMovement } from "@vs-engine/runtime/src/sim/projectiles/ProjectileMovementSystem";
import { spawnProjectilesFromCommands } from "@vs-engine/runtime/src/sim/projectiles/ProjectileSpawnSystem";
import { ensureProjectileStore } from "@vs-engine/runtime/src/sim/projectiles/ProjectileStore";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

test("projectiles advance by velocity after spawn commands are applied", () => {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 29);
  world.commands.projectileSpawn.enqueueValues(0, 1, 5, 10, 60, -30, 6, 12, 2, 0, 1);

  const context = {
    dt: 0.5,
    tick: 1,
    elapsedSeconds: 0.5,
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

  spawnProjectilesFromCommands(context);
  stepProjectileMovement(context);

  const store = ensureProjectileStore(world);
  assert.equal(store.activeCount, 1);
  assert.equal(store.posX[0], 35);
  assert.equal(store.posY[0], -5);
  assert.equal(store.remainingLife[0], 1.5);
});
