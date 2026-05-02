import { DEFAULT_SIM_BOUNDS } from "../core/SimConfig.ts";
import type { FrameContext } from "../core/FrameContext.ts";
import type { PickupDef } from "../content/ContentTypes.ts";
import type { SimContent } from "../core/SimApi.ts";

const MAGNET_PICKUP_SPAWN_INTERVAL_SECONDS = 24;
const MAGNET_PICKUP_SPAWN_CHANCE = 0.38;
const MAX_ACTIVE_MAGNET_PICKUPS = 1;

const magnetPickupIndexCache = new WeakMap<object, number>();

function isPickupRegistry(content: SimContent): content is SimContent & { pickups: { defs: readonly PickupDef[] } } {
  const registry = content as Partial<{ pickups: { defs?: unknown } }>;
  return typeof content === "object" && content !== null && !!registry.pickups && Array.isArray(registry.pickups.defs);
}

function getMagnetPickupIndex(content: SimContent): number {
  if (!isPickupRegistry(content)) {
    return -1;
  }

  const cacheKey = content as object;
  const cached = magnetPickupIndexCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let foundIndex = -1;
  for (let index = 0; index < content.pickups.defs.length; index += 1) {
    if (content.pickups.defs[index].grantKind === "magnet") {
      foundIndex = index;
      break;
    }
  }

  magnetPickupIndexCache.set(cacheKey, foundIndex);
  return foundIndex;
}

function countActiveMagnetPickups(context: FrameContext, magnetPickupIndex: number): number {
  let count = 0;
  const store = context.world.stores.pickups;
  for (let slot = 0; slot < store.activeCount; slot += 1) {
    if (store.typeIds[slot] === magnetPickupIndex) {
      count += 1;
    }
  }
  return count;
}

export function stepMagnetPickupSpawner(context: FrameContext): void {
  const { world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }

  if (world.time.elapsedSeconds < world.scratch.nextMagnetPickupSpawnAtSeconds) {
    return;
  }

  world.scratch.nextMagnetPickupSpawnAtSeconds += MAGNET_PICKUP_SPAWN_INTERVAL_SECONDS;
  const magnetPickupIndex = getMagnetPickupIndex(world.content);
  if (magnetPickupIndex < 0 || !isPickupRegistry(world.content)) {
    return;
  }

  if (countActiveMagnetPickups(context, magnetPickupIndex) >= MAX_ACTIVE_MAGNET_PICKUPS) {
    return;
  }

  if (world.rng.next() > MAGNET_PICKUP_SPAWN_CHANCE) {
    return;
  }

  const pickupDef = world.content.pickups.defs[magnetPickupIndex];
  if (!pickupDef) {
    return;
  }

  const bounds = world.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player;
  const x = bounds.minX + world.rng.next() * (bounds.maxX - bounds.minX);
  const y = bounds.minY + world.rng.next() * (bounds.maxY - bounds.minY);
  world.commands.pickupSpawn.enqueue(magnetPickupIndex, x, y, pickupDef.radius, pickupDef.defaultValue);
}
