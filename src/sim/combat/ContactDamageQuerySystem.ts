import type { FrameContext } from "../core/FrameContext";
import { ensureEnemyStore } from "../enemies/EnemyStore";
import { ensureSpatialGrid } from "../spatial/SpatialGrid";
import { circlesOverlap } from "./DamageTypes";

export function queryContactDamage(context: FrameContext): void {
  const player = context.world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }

  const enemies = ensureEnemyStore(context.world);
  const spatialGrid = ensureSpatialGrid(context.world);

  spatialGrid.queryNearbySlots(player.posX, player.posY, player.radius, (enemySlot) => {
    if (!enemies.isAlive(enemySlot)) {
      return;
    }

    const enemyDamage = enemies.contactDamage[enemySlot];
    if (enemyDamage <= 0) {
      return;
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
      return;
    }

    context.world.commands.damage.enqueue("player", 0, enemyDamage, "contact", enemySlot);
  });
}

