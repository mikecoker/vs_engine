import { ensureEnemyStore } from "../enemies/EnemyStore.ts";
import type { World } from "../world/World.ts";

export function findNearestEnemySlot(
  world: World,
  originX: number,
  originY: number,
  maxRange = Number.POSITIVE_INFINITY,
): number {
  const enemies = ensureEnemyStore(world);
  const maxRangeSq = maxRange * maxRange;
  let bestSlot = -1;
  let bestDistanceSq = maxRangeSq;

  for (let denseIndex = 0; denseIndex < enemies.activeCount; denseIndex += 1) {
    const slot = enemies.activeSlots[denseIndex];
    const dx = enemies.posX[slot] - originX;
    const dy = enemies.posY[slot] - originY;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > bestDistanceSq) {
      continue;
    }

    bestDistanceSq = distanceSq;
    bestSlot = slot;
  }

  return bestSlot;
}

