import type { RenderSnapshot } from "./RenderSnapshot.ts";
import type { World } from "../world/World.ts";
import { ensureEnemyStore, syncEnemyRenderViews } from "../enemies/EnemyStore.ts";
import { ensurePickupStore, syncPickupRenderViews } from "../pickups/PickupStore.ts";
import { ensureProjectileStore, syncProjectileRenderViews } from "../projectiles/ProjectileStore.ts";
import { ensureWeaponRuntimeStore, syncWeaponRenderViews } from "../combat/WeaponRuntimeStore.ts";

export function extractRenderSnapshot(world: World): RenderSnapshot {
  const enemies = ensureEnemyStore(world);
  const projectiles = ensureProjectileStore(world);
  const pickups = ensurePickupStore(world);
  const weapons = ensureWeaponRuntimeStore(world);
  syncEnemyRenderViews(enemies);
  syncProjectileRenderViews(projectiles);
  syncPickupRenderViews(pickups);
  syncWeaponRenderViews(weapons);

  return {
    runState: world.runState.current,
    elapsedSeconds: world.time.elapsedSeconds,
    player: {
      exists: world.stores.player.exists,
      x: world.stores.player.posX,
      y: world.stores.player.posY,
      radius: world.stores.player.radius,
      hp: world.stores.player.hp,
      maxHp: world.stores.player.maxHp,
    },
    enemies: {
      activeCount: enemies.activeCount,
      typeIds: enemies.renderTypeIds,
      posX: enemies.renderPosX,
      posY: enemies.renderPosY,
    },
    projectiles: {
      activeCount: projectiles.activeCount,
      typeIds: projectiles.renderTypeIds,
      posX: projectiles.renderPosX,
      posY: projectiles.renderPosY,
    },
    pickups: {
      activeCount: pickups.activeCount,
      typeIds: pickups.renderTypeIds,
      posX: pickups.renderPosX,
      posY: pickups.renderPosY,
    },
    progression: {
      level: world.stores.progression.level,
      xp: world.stores.progression.xp,
      xpToNext: world.stores.progression.xpToNext,
      queuedLevelUps: world.stores.progression.queuedLevelUps,
    },
    weapons: {
      activeCount: weapons.activeCount,
      typeIds: weapons.renderTypeIds,
      levels: weapons.renderLevels,
      cooldownRemaining: weapons.renderCooldownRemaining,
      lastFireElapsedSeconds: weapons.renderLastFireElapsedSeconds,
    },
  };
}
