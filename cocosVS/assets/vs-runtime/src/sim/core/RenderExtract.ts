import type { RenderSnapshot } from "./RenderSnapshot.ts";
import type { World } from "../world/World.ts";
import { ensureEnemyStore, syncEnemyRenderViews } from "../enemies/EnemyStore.ts";
import { ensureWeaponRuntimeStore } from "../combat/WeaponRuntimeStore.ts";

export function extractRenderSnapshot(world: World): RenderSnapshot {
  const enemies = ensureEnemyStore(world);
  const weapons = ensureWeaponRuntimeStore(world);
  syncEnemyRenderViews(enemies);

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
      activeCount: world.stores.projectiles.activeCount,
      typeIds: world.stores.projectiles.typeIds,
      posX: world.stores.projectiles.posX,
      posY: world.stores.projectiles.posY,
    },
    pickups: {
      activeCount: world.stores.pickups.activeCount,
      typeIds: world.stores.pickups.typeIds,
      posX: world.stores.pickups.posX,
      posY: world.stores.pickups.posY,
    },
    progression: {
      level: world.stores.progression.level,
      xp: world.stores.progression.xp,
      xpToNext: world.stores.progression.xpToNext,
      queuedLevelUps: world.stores.progression.queuedLevelUps,
    },
    weapons: {
      activeCount: weapons.activeCount,
      typeIds: weapons.weaponTypeIds,
      levels: weapons.weaponLevels,
      cooldownRemaining: weapons.cooldownRemaining,
      lastFireElapsedSeconds: weapons.lastFireElapsedSeconds,
    },
  };
}
