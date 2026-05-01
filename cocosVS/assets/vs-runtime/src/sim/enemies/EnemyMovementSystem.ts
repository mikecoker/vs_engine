import type { FrameContext } from "../core/FrameContext.ts";
import { ensureEnemyStore, forEachActiveEnemySlot } from "./EnemyStore.ts";

const MIN_DIRECTION_DISTANCE = 0.0001;

export function stepEnemyMovement(context: FrameContext): void {
  const { dt, world } = context;
  const store = ensureEnemyStore(world);
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

    store.velX[slot] = nx * speed;
    store.velY[slot] = ny * speed;
    store.posX[slot] += store.velX[slot] * dt;
    store.posY[slot] += store.velY[slot] * dt;
  });
}
