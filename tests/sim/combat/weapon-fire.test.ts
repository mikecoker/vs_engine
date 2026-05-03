import assert from "node:assert/strict";
import test from "node:test";

import type { ContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentRegistry";
import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { ensureWeaponRuntimeStore } from "@vs-engine/runtime/src/sim/combat/WeaponRuntimeStore";
import { ensureEnemyStore } from "@vs-engine/runtime/src/sim/enemies/EnemyStore";
import { initializePlayerForRun } from "@vs-engine/runtime/src/sim/player/PlayerReset";
import { stepWeaponFire } from "@vs-engine/runtime/src/sim/combat/WeaponFireSystem";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

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

test("weapon levels increase projectile output", () => {
  const context = createCombatContext();
  const weapons = ensureWeaponRuntimeStore(context.world);
  weapons.weaponLevels[0] = 3;

  const enemies = ensureEnemyStore(context.world);
  const enemySlot = enemies.allocate();
  enemies.posX[enemySlot] = 200;
  enemies.posY[enemySlot] = 0;
  enemies.radius[enemySlot] = 10;
  enemies.hp[enemySlot] = 10;

  stepWeaponFire(context);

  assert.equal(context.world.commands.projectileSpawn.count, 2);
});

test("weapon targeting prioritizes minibosses and bosses over nearer trash mobs", () => {
  const context = createCombatContext();
  const enemies = ensureEnemyStore(context.world);

  const batSlot = enemies.allocate();
  enemies.posX[batSlot] = 90;
  enemies.posY[batSlot] = 0;
  enemies.radius[batSlot] = 10;
  enemies.hp[batSlot] = 10;
  enemies.xpValue[batSlot] = 1;

  const bossSlot = enemies.allocate();
  enemies.posX[bossSlot] = 0;
  enemies.posY[bossSlot] = 220;
  enemies.radius[bossSlot] = 24;
  enemies.hp[bossSlot] = 500;
  enemies.xpValue[bossSlot] = 24;

  stepWeaponFire(context);

  assert.equal(context.world.commands.projectileSpawn.count, 1);
  const projectile = context.world.commands.projectileSpawn.get(0);
  assert.equal(Math.abs(projectile.velX) < 1e-6, true);
  assert.equal(projectile.velY > 0, true);
});

test("weapon targeting ignores elite priority outside local range", () => {
  const context = createCombatContext();
  const enemies = ensureEnemyStore(context.world);

  const batSlot = enemies.allocate();
  enemies.posX[batSlot] = 90;
  enemies.posY[batSlot] = 0;
  enemies.radius[batSlot] = 10;
  enemies.hp[batSlot] = 10;
  enemies.xpValue[batSlot] = 1;

  const bossSlot = enemies.allocate();
  enemies.posX[bossSlot] = 0;
  enemies.posY[bossSlot] = 520;
  enemies.radius[bossSlot] = 24;
  enemies.hp[bossSlot] = 500;
  enemies.xpValue[bossSlot] = 24;

  stepWeaponFire(context);

  assert.equal(context.world.commands.projectileSpawn.count, 1);
  const projectile = context.world.commands.projectileSpawn.get(0);
  assert.equal(projectile.velX > 0, true);
  assert.equal(Math.abs(projectile.velY) < 1e-6, true);
});

test("holy aura applies area damage around the player", () => {
  const context = createCombatContext();
  const content = context.world.content as ContentRegistry;
  const weapons = ensureWeaponRuntimeStore(context.world);

  weapons.weaponTypeIds[1] = content.weapons.getIndex("weapon.holy_aura");
  weapons.weaponLevels[1] = 1;
  weapons.cooldownRemaining[1] = 0;
  weapons.activeCount = 2;

  const enemies = ensureEnemyStore(context.world);
  const nearSlot = enemies.allocate();
  enemies.posX[nearSlot] = 20;
  enemies.posY[nearSlot] = 0;
  enemies.radius[nearSlot] = 10;
  enemies.hp[nearSlot] = 10;

  const farSlot = enemies.allocate();
  enemies.posX[farSlot] = 220;
  enemies.posY[farSlot] = 0;
  enemies.radius[farSlot] = 10;
  enemies.hp[farSlot] = 10;

  stepWeaponFire(context);

  assert.equal(context.world.commands.damage.count > 0, true);
  const targets = new Set<number>();
  for (let index = 0; index < context.world.commands.damage.count; index += 1) {
    targets.add(context.world.commands.damage.get(index).targetId);
  }

  assert.equal(targets.has(nearSlot), true);
  assert.equal(targets.has(farSlot), false);
});

test("arc nova applies radial damage around the player", () => {
  const context = createCombatContext();
  const content = context.world.content as ContentRegistry;
  const weapons = ensureWeaponRuntimeStore(context.world);

  weapons.weaponTypeIds[1] = content.weapons.getIndex("weapon.arc_nova");
  weapons.weaponLevels[1] = 1;
  weapons.cooldownRemaining[1] = 0;
  weapons.activeCount = 2;

  const enemies = ensureEnemyStore(context.world);
  const nearSlot = enemies.allocate();
  enemies.posX[nearSlot] = 30;
  enemies.posY[nearSlot] = 30;
  enemies.radius[nearSlot] = 10;
  enemies.hp[nearSlot] = 10;

  stepWeaponFire(context);

  assert.equal(context.world.commands.damage.count > 0, true);
});
