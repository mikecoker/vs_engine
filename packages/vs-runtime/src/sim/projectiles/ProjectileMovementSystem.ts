import type { FrameContext } from "../core/FrameContext.ts";
import { releaseProjectile } from "./ProjectileLifecycle.ts";
import { ensureProjectileStore } from "./ProjectileStore.ts";

export function stepProjectileMovement(context: FrameContext): void {
  const store = ensureProjectileStore(context.world);
  let denseIndex = 0;
  while (denseIndex < store.activeCount) {
    const slot = store.activeSlots[denseIndex];
    store.posX[slot] += store.velX[slot] * context.dt;
    store.posY[slot] += store.velY[slot] * context.dt;
    store.remainingLife[slot] -= context.dt;

    if (store.remainingLife[slot] <= 0) {
      releaseProjectile(store, slot);
      continue;
    }

    denseIndex += 1;
  }
}
