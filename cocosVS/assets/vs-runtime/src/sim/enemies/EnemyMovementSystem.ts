import type { FrameContext } from "../core/FrameContext.ts";
import { ensureEnemyStore, forEachActiveEnemySlot } from "./EnemyStore.ts";
import { ensureSpatialGrid } from "../spatial/SpatialGrid.ts";

const MIN_DIRECTION_DISTANCE = 0.0001;
const SEPARATION_RADIUS_SCALE = 1.5;
const SEPARATION_FORCE = 0.85;

export function stepEnemyMovement(context: FrameContext): void {
  const { dt, world } = context;
  const store = ensureEnemyStore(world);
  const spatialGrid = ensureSpatialGrid(world);
  const player = world.stores.player;
  const targetX = player.exists ? player.posX : 0;
  const targetY = player.exists ? player.posY : 0;

  forEachActiveEnemySlot(store, (slot) => {
    const dx = targetX - store.posX[slot];
    const dy = targetY - store.posY[slot];
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared <= MIN_DIRECTION_DISTANCE) {
      store.velX[slot] = 0;
      store.velY[slot] = 0;
      return;
    }

    const distance = Math.sqrt(distanceSquared);
    const nx = dx / distance;
    const ny = dy / distance;
    const speed = store.moveSpeed[slot];
    const separationRadius = Math.max(store.radius[slot] * SEPARATION_RADIUS_SCALE, 1);
    let separationX = 0;
    let separationY = 0;

    spatialGrid.queryNearbySlots(
      store.posX[slot],
      store.posY[slot],
      separationRadius,
      (otherSlot) => {
        if (otherSlot === slot || !store.isAlive(otherSlot)) {
          return;
        }

        const offsetX = store.posX[slot] - store.posX[otherSlot];
        const offsetY = store.posY[slot] - store.posY[otherSlot];
        const combinedRadius = store.radius[slot] + store.radius[otherSlot];
        const separationDistanceSquared = offsetX * offsetX + offsetY * offsetY;
        if (separationDistanceSquared <= MIN_DIRECTION_DISTANCE) {
          const tieBreaker = slot < otherSlot ? -1 : 1;
          separationY += tieBreaker;
          return;
        }

        const separationDistance = Math.sqrt(separationDistanceSquared);
        if (separationDistance >= combinedRadius || separationDistance >= separationRadius) {
          return;
        }

        const overlapRatio = 1 - separationDistance / Math.max(combinedRadius, separationRadius);
        separationX += (offsetX / separationDistance) * overlapRatio;
        separationY += (offsetY / separationDistance) * overlapRatio;
      },
    );

    const moveX = nx + separationX * SEPARATION_FORCE;
    const moveY = ny + separationY * SEPARATION_FORCE;
    const moveMagnitude = Math.hypot(moveX, moveY);
    const finalX = moveMagnitude > MIN_DIRECTION_DISTANCE ? moveX / moveMagnitude : nx;
    const finalY = moveMagnitude > MIN_DIRECTION_DISTANCE ? moveY / moveMagnitude : ny;

    store.velX[slot] = finalX * speed;
    store.velY[slot] = finalY * speed;
    store.posX[slot] += store.velX[slot] * dt;
    store.posY[slot] += store.velY[slot] * dt;
  });
}
