import type { ContentRegistry } from "../content/ContentRegistry";
import type { PickupDef } from "../content/ContentTypes";
import type { SimContent } from "../core/SimApi";
import type { FrameContext } from "../core/FrameContext";
import { applyDamageToPlayer, tickPlayerInvulnerability } from "../player/PlayerApi";
import { createEnemyDeathInfo, releaseEnemy } from "../enemies/EnemyLifecycle";
import { ensureEnemyStore } from "../enemies/EnemyStore";
import { RunState } from "../core/RunState";
import { clampDamageAmount } from "./DamageTypes";

const xpPickupIndexCache = new WeakMap<object, number>();

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
  if (!isContentRegistry(content)) {
    return -1;
  }

  const cacheKey = content as object;
  const cached = xpPickupIndexCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let foundIndex = -1;
  for (let index = 0; index < content.pickups.defs.length; index += 1) {
    if (content.pickups.defs[index].grantKind === "xp") {
      foundIndex = index;
      break;
    }
  }

  xpPickupIndexCache.set(cacheKey, foundIndex);
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
    const xpPickupIndex = getDefaultXpPickupIndex(context.world.content);
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

