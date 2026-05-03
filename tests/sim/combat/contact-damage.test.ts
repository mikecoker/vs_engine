import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { queryContactDamage } from "@vs-engine/runtime/src/sim/combat/ContactDamageQuerySystem";
import { resolveDamage } from "@vs-engine/runtime/src/sim/combat/DamageResolveSystem";
import { ensureEnemyStore } from "@vs-engine/runtime/src/sim/enemies/EnemyStore";
import { initializePlayerForRun } from "@vs-engine/runtime/src/sim/player/PlayerReset";
import { rebuildSpatialGrid } from "@vs-engine/runtime/src/sim/spatial/SpatialGridBuildSystem";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

function createCombatContext(): FrameContext {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 17);
  initializePlayerForRun(world.stores.player, world.content);

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

test("contact damage is gated by player invulnerability", () => {
  const context = createCombatContext();
  const enemies = ensureEnemyStore(context.world);
  const enemySlot = enemies.allocate();
  enemies.posX[enemySlot] = context.world.stores.player.posX;
  enemies.posY[enemySlot] = context.world.stores.player.posY;
  enemies.radius[enemySlot] = 14;
  enemies.contactDamage[enemySlot] = 8;

  rebuildSpatialGrid(context);
  queryContactDamage(context);
  resolveDamage(context);

  assert.equal(context.world.stores.player.hp, 92);

  queryContactDamage(context);
  resolveDamage(context);
  assert.equal(context.world.stores.player.hp, 92);
});

