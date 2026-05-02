import type { FrameContext } from "../core/FrameContext.ts";
import { ensurePickupStore, getPickupDefByIndex } from "./PickupStore.ts";
import { PICKUP_MAGNET_DURATION_SECONDS } from "./PickupMagnetSystem.ts";

function magnetizeAllXpPickups(context: FrameContext): void {
  const store = ensurePickupStore(context.world);
  for (let slot = 0; slot < store.activeCount; slot += 1) {
    const pickupDef = getPickupDefByIndex(context.world.content, store.typeIds[slot]);
    if (pickupDef?.grantKind !== "xp") {
      continue;
    }

    store.magnetized[slot] = 1;
    store.magnetTimeRemaining[slot] = PICKUP_MAGNET_DURATION_SECONDS;
  }
}

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
    const pickupDef = getPickupDefByIndex(world.content, store.typeIds[slot]);
    if (value > 0 && pickupDef?.grantKind === "xp") {
      world.commands.xpGrant.enqueue(value);
    } else if (value > 0 && pickupDef?.grantKind === "heal") {
      if (player.hp >= player.maxHp) {
        slot += 1;
        continue;
      }

      player.hp = Math.min(player.maxHp, player.hp + value);
    } else if (pickupDef?.grantKind === "magnet") {
      magnetizeAllXpPickups(context);
    }
    store.release(slot);
  }
}
