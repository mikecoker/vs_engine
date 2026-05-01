import type { FrameContext } from "../core/FrameContext.ts";
import { ensureEnemyStore } from "../enemies/EnemyStore.ts";
import { ensureSpatialGrid } from "../spatial/SpatialGrid.ts";
import { circlesOverlap } from "../combat/DamageTypes.ts";
import { releaseProjectile } from "./ProjectileLifecycle.ts";
import { ensureProjectileStore } from "./ProjectileStore.ts";

export function queryProjectileHits(context: FrameContext): void {
  const projectiles = ensureProjectileStore(context.world);
  const enemies = ensureEnemyStore(context.world);
  const spatialGrid = ensureSpatialGrid(context.world);

  let projectileSlot = 0;
  while (projectileSlot < projectiles.activeCount) {
    const projectileX = projectiles.posX[projectileSlot];
    const projectileY = projectiles.posY[projectileSlot];
    const projectileRadius = projectiles.radius[projectileSlot];
    const projectileDamage = projectiles.damage[projectileSlot];
    let remainingPierce = projectiles.remainingPierce[projectileSlot];
    let shouldDespawn = false;

    spatialGrid.queryNearbySlots(projectileX, projectileY, projectileRadius, (enemySlot) => {
      if (shouldDespawn || !enemies.isAlive(enemySlot)) {
        return;
      }

      if (
        !circlesOverlap(
          projectileX,
          projectileY,
          projectileRadius,
          enemies.posX[enemySlot],
          enemies.posY[enemySlot],
          enemies.radius[enemySlot],
        )
      ) {
        return;
      }

      context.world.commands.damage.enqueue("enemy", enemySlot, projectileDamage, "projectile", projectileSlot);
      if (remainingPierce > 0) {
        remainingPierce -= 1;
        return;
      }

      shouldDespawn = true;
    });

    if (shouldDespawn) {
      releaseProjectile(projectiles, projectileSlot);
      continue;
    }

    projectiles.remainingPierce[projectileSlot] = remainingPierce;
    projectileSlot += 1;
  }
}

