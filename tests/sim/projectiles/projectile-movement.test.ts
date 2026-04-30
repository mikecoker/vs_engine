import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import type { FrameContext } from "../../../src/sim/core/FrameContext";
import { RunState } from "../../../src/sim/core/RunState";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { stepProjectileMovement } from "../../../src/sim/projectiles/ProjectileMovementSystem";
import { ensureProjectileStore } from "../../../src/sim/projectiles/ProjectileStore";
import { createWorld } from "../../../src/sim/world/World";

test("projectiles spawn from commands and advance by velocity", () => {
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

  stepProjectileMovement(context);

  const store = ensureProjectileStore(world);
  assert.equal(store.activeCount, 1);
  assert.equal(store.posX[0], 35);
  assert.equal(store.posY[0], -5);
  assert.equal(store.remainingLife[0], 1.5);
});

