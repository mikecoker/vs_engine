import type { FrameContext } from "../core/FrameContext.ts";
import { ensurePickupStore } from "./PickupStore.ts";

export function stepPickupCollectSystem(context: FrameContext): void {
  const { world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }

  const store = ensurePickupStore(world);
  let slot = 0;
  while (slot < store.activeCount) {
    const dx = player.posX - store.posX[slot];
    const dy = player.posY - store.posY[slot];
    const radius = player.radius + store.radius[slot];
    if (dx * dx + dy * dy > radius * radius) {
      slot += 1;
      continue;
    }

    const value = store.value[slot];
    if (value > 0) {
      world.commands.xpGrant.enqueue(value);
    }
    store.release(slot);
  }
}
