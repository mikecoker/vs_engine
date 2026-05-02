import type { FrameContext } from "../core/FrameContext.ts";
import { ensurePickupStore } from "./PickupStore.ts";

export const PICKUP_MAGNET_DURATION_SECONDS = 0.25;

export function stepPickupMagnetSystem(context: FrameContext): void {
  const { dt, world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }

  const store = ensurePickupStore(world);
  const magnetRadius = Math.max(0, player.pickupRadius);

  for (let slot = 0; slot < store.activeCount; slot += 1) {
    if (!store.isAlive(slot)) {
      continue;
    }

    const dx = player.posX - store.posX[slot];
    const dy = player.posY - store.posY[slot];
    const distanceSq = dx * dx + dy * dy;
    if (!store.magnetized[slot]) {
      if (distanceSq > magnetRadius * magnetRadius) {
        continue;
      }
      store.magnetized[slot] = 1;
      store.magnetTimeRemaining[slot] = PICKUP_MAGNET_DURATION_SECONDS;
    }

    const distance = Math.sqrt(distanceSq);
    if (distance <= 0.0001) {
      store.velX[slot] = 0;
      store.velY[slot] = 0;
      store.posX[slot] = player.posX;
      store.posY[slot] = player.posY;
      store.magnetTimeRemaining[slot] = 0;
      continue;
    }

    const remaining = Math.max(dt, store.magnetTimeRemaining[slot]);
    const alpha = Math.min(1, dt / remaining);
    const nextX = store.posX[slot] + dx * alpha;
    const nextY = store.posY[slot] + dy * alpha;
    store.velX[slot] = (nextX - store.posX[slot]) / dt;
    store.velY[slot] = (nextY - store.posY[slot]) / dt;
    store.posX[slot] = nextX;
    store.posY[slot] = nextY;
    store.magnetTimeRemaining[slot] = Math.max(0, remaining - dt);
  }
}
