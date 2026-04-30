import test from "node:test";
import assert from "node:assert/strict";

import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { RunState } from "../../../src/sim/core/RunState";
import type { FrameContext } from "../../../src/sim/core/FrameContext";
import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { createWorld } from "../../../src/sim/world/World";
import { applyEnemySpawnCommands } from "../../../src/sim/enemies/EnemySpawnSystem";
import { stepEnemyMovement } from "../../../src/sim/enemies/EnemyMovementSystem";
import { ensureEnemyStore } from "../../../src/sim/enemies/EnemyStore";

test("enemy movement reduces distance to the player", () => {
  const config = mergeSimConfig();
  const world = createWorld(config, loadPrototypeContentRegistry(), RunState.Running, 31);
  const context: FrameContext = {
    dt: config.fixedStepSeconds,
    tick: 0,
    elapsedSeconds: 0,
    frameInput: {
      moveX: 0,
      moveY: 0,
      pausePressed: false,
      confirmPressed: false,
      cancelPressed: false,
    },
    config,
    world,
  };

  world.stores.player.exists = true;
  world.stores.player.posX = 0;
  world.stores.player.posY = 0;
  world.commands.enemySpawn.enqueue(0, 300, 0);
  applyEnemySpawnCommands(context);

  const store = ensureEnemyStore(world);
  const slot = store.activeSlots[0];
  const before = Math.abs(store.posX[slot] - world.stores.player.posX);

  stepEnemyMovement(context);

  const after = Math.abs(store.posX[slot] - world.stores.player.posX);
  assert.equal(after < before, true);
});
