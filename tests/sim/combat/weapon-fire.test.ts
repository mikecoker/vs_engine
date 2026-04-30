import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import type { FrameContext } from "../../../src/sim/core/FrameContext";
import { RunState } from "../../../src/sim/core/RunState";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { ensureEnemyStore } from "../../../src/sim/enemies/EnemyStore";
import { initializePlayerForRun } from "../../../src/sim/player/PlayerReset";
import { stepWeaponFire } from "../../../src/sim/combat/WeaponFireSystem";
import { createWorld } from "../../../src/sim/world/World";

function createCombatContext(): FrameContext {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 11);
  initializePlayerForRun(world.stores.player, world.content);
  world.time.tick = 1;

  return {
    dt: world.config.fixedStepSeconds,
    tick: world.time.tick,
    elapsedSeconds: world.time.elapsedSeconds,
    frameInput: {
      moveX: 0,
      moveY: 0,
      pausePressed: false,
      confirmPressed: false,
      cancelPressed: false,
    },
    config: world.config,
    world,
  };
}

test("weapon fire emits a starter projectile on cooldown threshold", () => {
  const context = createCombatContext();
  const enemies = ensureEnemyStore(context.world);
  const enemySlot = enemies.allocate();
  enemies.posX[enemySlot] = 200;
  enemies.posY[enemySlot] = 0;
  enemies.radius[enemySlot] = 10;
  enemies.hp[enemySlot] = 10;

  stepWeaponFire(context);

  assert.equal(context.world.commands.projectileSpawn.count, 1);
  const projectile = context.world.commands.projectileSpawn.get(0);
  assert.equal(projectile.projectileTypeId, 0);
  assert.notEqual(projectile.velX, 0);
  assert.equal(projectile.velY, 0);

  stepWeaponFire(context);
  assert.equal(context.world.commands.projectileSpawn.count, 1);
});

