import type { ContentRegistry } from "../content/ContentRegistry.ts";
import type { PickupDef, PickupGrantKind } from "../content/ContentTypes.ts";
import type { SimContent } from "../core/SimApi.ts";
import type { FrameContext } from "../core/FrameContext.ts";
import { applyDamageToPlayer, tickPlayerInvulnerability } from "../player/PlayerApi.ts";
import { createEnemyDeathInfo, releaseEnemy } from "../enemies/EnemyLifecycle.ts";
import { ensureEnemyStore } from "../enemies/EnemyStore.ts";
import { RunState } from "../core/RunState.ts";
import { clampDamageAmount } from "./DamageTypes.ts";

const xpPickupIndexCache = new WeakMap<object, number>();
const mediumXpPickupIndexCache = new WeakMap<object, number>();
const largeXpPickupIndexCache = new WeakMap<object, number>();

function isContentRegistry(value: SimContent): value is SimContent & ContentRegistry {
  const registry = value as Partial<ContentRegistry>;
  return (
    typeof value === "object" &&
    value !== null &&
    !!registry.pickups &&
    Array.isArray(registry.pickups.defs)
  );
}

function getDefaultXpPickupIndex(content: SimContent): number {
  return getPickupIndexById(content, "pickup.xp_small", xpPickupIndexCache, "xp");
}

function getMediumXpPickupIndex(content: SimContent): number {
  return getPickupIndexById(content, "pickup.xp_medium", mediumXpPickupIndexCache, "xp");
}

function getLargeXpPickupIndex(content: SimContent): number {
  return getPickupIndexById(content, "pickup.xp_large", largeXpPickupIndexCache, "xp");
}

function getPickupIndexById(
  content: SimContent,
  pickupId: string,
  cache: WeakMap<object, number>,
  fallbackGrantKind: PickupGrantKind,
): number {
  if (!isContentRegistry(content)) {
    return -1;
  }

  const cacheKey = content as object;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let foundIndex = -1;
  for (let index = 0; index < content.pickups.defs.length; index += 1) {
    if (content.pickups.defs[index].id === pickupId) {
      foundIndex = index;
      break;
    }
  }

  if (foundIndex < 0) {
    for (let index = 0; index < content.pickups.defs.length; index += 1) {
      if (content.pickups.defs[index].grantKind === fallbackGrantKind) {
        foundIndex = index;
        break;
      }
    }
  }

  cache.set(cacheKey, foundIndex);
  return foundIndex;
}

function getXpPickupDef(content: SimContent, pickupIndex: number): PickupDef | null {
  if (!isContentRegistry(content) || pickupIndex < 0) {
    return null;
  }

  return content.pickups.defs[pickupIndex] ?? null;
}

function emitEnemyDeathConsequences(context: FrameContext, slot: number): void {
  const deathInfo = createEnemyDeathInfo(context.world, slot);
  if (!deathInfo) {
    return;
  }

  const xpAmount = Math.max(0, deathInfo.xpValue);
  if (xpAmount > 0) {
    const xpPickupIndex = xpAmount >= 24
      ? getLargeXpPickupIndex(context.world.content)
      : xpAmount >= 8
        ? getMediumXpPickupIndex(context.world.content)
        : getDefaultXpPickupIndex(context.world.content);
    const pickupDef = getXpPickupDef(context.world.content, xpPickupIndex);

    if (pickupDef) {
      context.world.commands.pickupSpawn.enqueue(
        xpPickupIndex,
        deathInfo.x,
        deathInfo.y,
        pickupDef.radius,
        xpAmount,
      );
    } else {
      context.world.commands.xpGrant.enqueue(xpAmount);
    }
  }

  releaseEnemy(context.world, slot);
}

export function resolveDamage(context: FrameContext): void {
  const { dt, world } = context;
  const player = world.stores.player;
  const enemies = ensureEnemyStore(world);
  const damageBuffer = world.commands.damage;

  tickPlayerInvulnerability(player, dt);

  const damageCount = damageBuffer.count;
  for (let index = 0; index < damageCount; index += 1) {
    const command = damageBuffer.get(index);
    const amount = clampDamageAmount(command.amount);
    if (amount <= 0) {
      continue;
    }

    if (command.targetKind === "player") {
      const result = applyDamageToPlayer(player, amount, command.sourceKind);
      if (result.killedPlayer) {
        world.commands.stateChange.enqueue(RunState.GameOver, "player-death");
      }
      continue;
    }

    if (!enemies.isAlive(command.targetId)) {
      continue;
    }

    enemies.hp[command.targetId] = Math.max(0, enemies.hp[command.targetId] - amount);
    if (enemies.hp[command.targetId] > 0) {
      continue;
    }

    emitEnemyDeathConsequences(context, command.targetId);
  }

  damageBuffer.clear();
}
