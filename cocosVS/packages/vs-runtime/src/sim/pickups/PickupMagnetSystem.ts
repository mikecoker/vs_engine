import type { FrameContext } from "../core/FrameContext";
import { ensurePickupStore } from "./PickupStore";

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
    }

    const distance = Math.sqrt(distanceSq);
    if (distance <= 0.0001) {
      store.velX[slot] = 0;
      store.velY[slot] = 0;
      continue;
    }

    const speed = store.magnetSpeed[slot];
    store.velX[slot] = (dx / distance) * speed;
    store.velY[slot] = (dy / distance) * speed;
    store.posX[slot] += store.velX[slot] * dt;
    store.posY[slot] += store.velY[slot] * dt;
  }
}
