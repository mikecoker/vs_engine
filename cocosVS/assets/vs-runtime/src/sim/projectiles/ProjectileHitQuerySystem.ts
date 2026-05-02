import type { FrameContext } from "../core/FrameContext.ts";
import { ensureEnemyStore } from "../enemies/EnemyStore.ts";
import { cellCoord, createCellKey, ensureSpatialGrid } from "../spatial/SpatialGrid.ts";
import { circlesOverlap } from "../combat/DamageTypes.ts";
import { releaseProjectile } from "./ProjectileLifecycle.ts";
import { ensureProjectileStore } from "./ProjectileStore.ts";

export function queryProjectileHits(context: FrameContext): void {
  const projectiles = ensureProjectileStore(context.world);
  const enemies = ensureEnemyStore(context.world);
  const spatialGrid = ensureSpatialGrid(context.world);

  let projectileDenseIndex = 0;
  while (projectileDenseIndex < projectiles.activeCount) {
    const projectileSlot = projectiles.activeSlots[projectileDenseIndex];
    const projectileX = projectiles.posX[projectileSlot];
    const projectileY = projectiles.posY[projectileSlot];
    const projectileRadius = projectiles.radius[projectileSlot];
    const projectileDamage = projectiles.damage[projectileSlot];
    let remainingPierce = projectiles.remainingPierce[projectileSlot];
    let shouldDespawn = false;

    const minCellX = cellCoord(projectileX - projectileRadius, spatialGrid.cellSize);
    const maxCellX = cellCoord(projectileX + projectileRadius, spatialGrid.cellSize);
    const minCellY = cellCoord(projectileY - projectileRadius, spatialGrid.cellSize);
    const maxCellY = cellCoord(projectileY + projectileRadius, spatialGrid.cellSize);

    for (let cellYIndex = minCellY; cellYIndex <= maxCellY && !shouldDespawn; cellYIndex += 1) {
      for (let cellXIndex = minCellX; cellXIndex <= maxCellX && !shouldDespawn; cellXIndex += 1) {
        const bucket = spatialGrid.buckets.get(createCellKey(cellXIndex, cellYIndex));
        if (!bucket) {
          continue;
        }

        for (let bucketIndex = 0; bucketIndex < bucket.length && !shouldDespawn; bucketIndex += 1) {
          const enemySlot = bucket[bucketIndex];
          if (!enemies.isAlive(enemySlot)) {
            continue;
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
            continue;
          }

          context.world.commands.damage.enqueue("enemy", enemySlot, projectileDamage, "projectile", projectileSlot);
          if (remainingPierce > 0) {
            remainingPierce -= 1;
            continue;
          }

          shouldDespawn = true;
        }
      }
    }

    if (shouldDespawn) {
      releaseProjectile(projectiles, projectileSlot);
      continue;
    }

    projectiles.remainingPierce[projectileSlot] = remainingPierce;
    projectileDenseIndex += 1;
  }
}
