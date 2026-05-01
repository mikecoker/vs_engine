import type { FrameContext } from "../core/FrameContext.ts";
import { releaseProjectile } from "./ProjectileLifecycle.ts";
import { spawnProjectilesFromCommands } from "./ProjectileSpawnSystem.ts";
import { ensureProjectileStore } from "./ProjectileStore.ts";

export function stepProjectileMovement(context: FrameContext): void {
  spawnProjectilesFromCommands(context);

  const store = ensureProjectileStore(context.world);
  let slot = 0;
  while (slot < store.activeCount) {
    store.posX[slot] += store.velX[slot] * context.dt;
    store.posY[slot] += store.velY[slot] * context.dt;
    store.remainingLife[slot] -= context.dt;

    if (store.remainingLife[slot] <= 0) {
      releaseProjectile(store, slot);
      continue;
    }

    slot += 1;
  }
}

