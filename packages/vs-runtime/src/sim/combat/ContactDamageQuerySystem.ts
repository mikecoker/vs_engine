import type { FrameContext } from "../core/FrameContext.ts";
import { ensureEnemyStore } from "../enemies/EnemyStore.ts";
import { cellCoord, createCellKey, ensureSpatialGrid } from "../spatial/SpatialGrid.ts";
import { circlesOverlap } from "./DamageTypes.ts";

export function queryContactDamage(context: FrameContext): void {
  const player = context.world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }

  const enemies = ensureEnemyStore(context.world);
  const spatialGrid = ensureSpatialGrid(context.world);

  const minCellX = cellCoord(player.posX - player.radius, spatialGrid.cellSize);
  const maxCellX = cellCoord(player.posX + player.radius, spatialGrid.cellSize);
  const minCellY = cellCoord(player.posY - player.radius, spatialGrid.cellSize);
  const maxCellY = cellCoord(player.posY + player.radius, spatialGrid.cellSize);

  for (let cellYIndex = minCellY; cellYIndex <= maxCellY; cellYIndex += 1) {
    for (let cellXIndex = minCellX; cellXIndex <= maxCellX; cellXIndex += 1) {
      const bucket = spatialGrid.buckets.get(createCellKey(cellXIndex, cellYIndex));
      if (!bucket) {
        continue;
      }

      for (let bucketIndex = 0; bucketIndex < bucket.length; bucketIndex += 1) {
        const enemySlot = bucket[bucketIndex];
        if (!enemies.isAlive(enemySlot)) {
          continue;
        }

        const enemyDamage = enemies.contactDamage[enemySlot];
        if (enemyDamage <= 0) {
          continue;
        }

        if (
          !circlesOverlap(
            player.posX,
            player.posY,
            player.radius,
            enemies.posX[enemySlot],
            enemies.posY[enemySlot],
            enemies.radius[enemySlot],
          )
        ) {
          continue;
        }

        context.world.commands.damage.enqueue("player", 0, enemyDamage, "contact", enemySlot);
      }
    }
  }
}
