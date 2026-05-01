import type { FrameContext } from "../core/FrameContext";
import { releaseProjectile } from "./ProjectileLifecycle";
import { spawnProjectilesFromCommands } from "./ProjectileSpawnSystem";
import { ensureProjectileStore } from "./ProjectileStore";

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

