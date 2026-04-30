import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import type { FrameContext } from "../../../src/sim/core/FrameContext";
import { RunState } from "../../../src/sim/core/RunState";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { ensureEnemyStore } from "../../../src/sim/enemies/EnemyStore";
import { queryProjectileHits } from "../../../src/sim/projectiles/ProjectileHitQuerySystem";
import { ensureProjectileStore } from "../../../src/sim/projectiles/ProjectileStore";
import { rebuildSpatialGrid } from "../../../src/sim/spatial/SpatialGridBuildSystem";
import { createWorld } from "../../../src/sim/world/World";

test("projectile hit queries enqueue enemy damage and despawn non-piercing projectiles", () => {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 31);
  const enemies = ensureEnemyStore(world);
  const enemySlot = enemies.allocate();
  enemies.posX[enemySlot] = 50;
  enemies.posY[enemySlot] = 0;
  enemies.radius[enemySlot] = 10;
  enemies.hp[enemySlot] = 20;

  const projectiles = ensureProjectileStore(world);
  const projectileSlot = projectiles.allocate();
  projectiles.posX[projectileSlot] = 50;
  projectiles.posY[projectileSlot] = 0;
  projectiles.radius[projectileSlot] = 6;
  projectiles.damage[projectileSlot] = 12;
  projectiles.remainingPierce[projectileSlot] = 0;

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

  rebuildSpatialGrid(context);
  queryProjectileHits(context);

  assert.equal(world.commands.damage.count, 1);
  assert.equal(world.commands.damage.get(0).targetId, enemySlot);
  assert.equal(projectiles.activeCount, 0);
});
