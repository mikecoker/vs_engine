import { DEFAULT_SIM_BOUNDS } from "../core/SimConfig.ts";
import type { FrameContext } from "../core/FrameContext.ts";
import type { PickupDef } from "../content/ContentTypes.ts";
import type { SimContent } from "../core/SimApi.ts";
import { ensurePickupStore } from "./PickupStore.ts";

const HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS = 18;
const MAX_ACTIVE_HEALTH_PICKUPS = 2;
const HEALTH_PICKUP_MIN_PLAYER_DISTANCE = 150;
const HEALTH_PICKUP_MAX_PLAYER_DISTANCE = 260;

const healthPickupIndexCache = new WeakMap<object, number>();

function isPickupRegistry(content: SimContent): content is SimContent & { pickups: { defs: readonly PickupDef[] } } {
  const registry = content as Partial<{ pickups: { defs?: unknown } }>;
  return typeof content === "object" && content !== null && !!registry.pickups && Array.isArray(registry.pickups.defs);
}

function getHealPickupIndex(content: SimContent): number {
  if (!isPickupRegistry(content)) {
    return -1;
  }

  const cacheKey = content as object;
  const cached = healthPickupIndexCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let foundIndex = -1;
  for (let index = 0; index < content.pickups.defs.length; index += 1) {
    if (content.pickups.defs[index].grantKind === "heal") {
      foundIndex = index;
      break;
    }
  }

  healthPickupIndexCache.set(cacheKey, foundIndex);
  return foundIndex;
}

function countActiveHealPickups(context: FrameContext, healPickupIndex: number): number {
  let count = 0;
  const store = ensurePickupStore(context.world);
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    if (store.typeIds[slot] === healPickupIndex) {
      count += 1;
    }
  }
  return count;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function stepHealthPickupSpawner(context: FrameContext): void {
  const { world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }

  if (world.time.elapsedSeconds < world.scratch.nextHealthPickupSpawnAtSeconds) {
    return;
  }

  const healPickupIndex = getHealPickupIndex(world.content);
  if (healPickupIndex < 0 || !isPickupRegistry(world.content)) {
    world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
    return;
  }

  if (countActiveHealPickups(context, healPickupIndex) >= MAX_ACTIVE_HEALTH_PICKUPS) {
    world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
    return;
  }

  const pickupDef = world.content.pickups.defs[healPickupIndex];
  if (!pickupDef) {
    world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
    return;
  }

  const bounds = world.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player;
  const angle = world.rng.next() * Math.PI * 2;
  const distance = HEALTH_PICKUP_MIN_PLAYER_DISTANCE +
    world.rng.next() * (HEALTH_PICKUP_MAX_PLAYER_DISTANCE - HEALTH_PICKUP_MIN_PLAYER_DISTANCE);
  const x = clamp(player.posX + Math.cos(angle) * distance, bounds.minX, bounds.maxX);
  const y = clamp(player.posY + Math.sin(angle) * distance, bounds.minY, bounds.maxY);
  world.commands.pickupSpawn.enqueue(healPickupIndex, x, y, pickupDef.radius, pickupDef.defaultValue);
  world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
}
