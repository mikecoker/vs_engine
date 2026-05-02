import type { FrameContext } from "../core/FrameContext.ts";
import { getPickupDefByIndex, ensurePickupStore } from "./PickupStore.ts";

export function applyPickupSpawnCommands(context: FrameContext): void {
  const { world } = context;
  const store = ensurePickupStore(world);
  const commandCount = world.commands.pickupSpawn.count;

  for (let commandIndex = 0; commandIndex < commandCount; commandIndex += 1) {
    const command = world.commands.pickupSpawn.get(commandIndex);
    const pickupDef = getPickupDefByIndex(world.content, command.pickupTypeId);
    if (!pickupDef) {
      continue;
    }

    const slot = store.allocate();
    store.typeIds[slot] = command.pickupTypeId;
    store.posX[slot] = command.x;
    store.posY[slot] = command.y;
    store.velX[slot] = 0;
    store.velY[slot] = 0;
    store.radius[slot] = command.radius > 0 ? command.radius : pickupDef.radius;
    store.value[slot] = command.value > 0 ? command.value : pickupDef.defaultValue;
    store.magnetized[slot] = 0;
    store.magnetTimeRemaining[slot] = 0;
    store.magnetSpeed[slot] = pickupDef.magnetSpeed;
  }

  world.commands.pickupSpawn.clear();
}
