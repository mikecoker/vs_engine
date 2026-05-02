import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import type { FrameContext } from "../../../src/sim/core/FrameContext";
import { RunState } from "../../../src/sim/core/RunState";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { resolveDamage } from "../../../src/sim/combat/DamageResolveSystem";
import { ensureEnemyStore } from "../../../src/sim/enemies/EnemyStore";
import { createWorld } from "../../../src/sim/world/World";

test("enemy death emits xp pickup spawn commands", () => {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 23);
  const enemies = ensureEnemyStore(world);
  const enemySlot = enemies.allocate();
  enemies.posX[enemySlot] = 10;
  enemies.posY[enemySlot] = 15;
  enemies.hp[enemySlot] = 6;
  enemies.maxHp[enemySlot] = 6;
  enemies.xpValue[enemySlot] = 3;

  world.commands.damage.enqueue("enemy", enemySlot, 10, "projectile", 0);

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

  resolveDamage(context);

  assert.equal(enemies.activeCount, 0);
  assert.equal(world.commands.pickupSpawn.count, 1);
  const pickup = world.commands.pickupSpawn.get(0);
  assert.equal(pickup.pickupTypeId, 0);
  assert.equal(pickup.x, 10);
  assert.equal(pickup.y, 15);
  assert.equal(pickup.value, 3);
});

test("boss-tier enemy deaths select larger xp pickup variants", () => {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 41);
  const enemies = ensureEnemyStore(world);
  const enemySlot = enemies.allocate();
  enemies.typeIds[enemySlot] = 4;
  enemies.posX[enemySlot] = -12;
  enemies.posY[enemySlot] = 22;
  enemies.hp[enemySlot] = 30;
  enemies.maxHp[enemySlot] = 30;
  enemies.xpValue[enemySlot] = 24;

  world.commands.damage.enqueue("enemy", enemySlot, 99, "projectile", 0);

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

  resolveDamage(context);

  assert.equal(world.commands.pickupSpawn.count, 1);
  const pickup = world.commands.pickupSpawn.get(0);
  assert.equal(pickup.pickupTypeId, 2);
  assert.equal(pickup.value, 24);
});
