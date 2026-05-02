import { ensureEnemyStore } from "../enemies/EnemyStore.ts";
import type { World } from "../world/World.ts";

function getEnemyTargetPriority(xpValue: number): number {
  if (xpValue >= 24) {
    return 2;
  }

  if (xpValue >= 12) {
    return 1;
  }

  return 0;
}

export function findNearestEnemySlot(
  world: World,
  originX: number,
  originY: number,
  maxRange = Number.POSITIVE_INFINITY,
): number {
  const enemies = ensureEnemyStore(world);
  const maxRangeSq = maxRange * maxRange;
  let bestSlot = -1;
  let bestPriority = -1;
  let bestDistanceSq = maxRangeSq;

  for (let denseIndex = 0; denseIndex < enemies.activeCount; denseIndex += 1) {
    const slot = enemies.activeSlots[denseIndex];
    const dx = enemies.posX[slot] - originX;
    const dy = enemies.posY[slot] - originY;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > maxRangeSq) {
      continue;
    }

    const priority = getEnemyTargetPriority(enemies.xpValue[slot]);
    if (priority < bestPriority) {
      continue;
    }

    if (priority === bestPriority && distanceSq > bestDistanceSq) {
      continue;
    }

    bestPriority = priority;
    bestDistanceSq = distanceSq;
    bestSlot = slot;
  }

  return bestSlot;
}
