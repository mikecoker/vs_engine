import type { ProjectileDef } from "../content/ContentTypes";
import type { FrameContext } from "../core/FrameContext";
import { ensureEnemyStore } from "../enemies/EnemyStore";
import { getWeaponDefByIndex } from "./WeaponRuntimeContent";
import { PLAYER_TEAM } from "./DamageTypes";
import { ensureWeaponRuntimeStore } from "./WeaponRuntimeStore";
import { findNearestEnemySlot } from "./WeaponTargeting";

const MIN_WEAPON_COOLDOWN_SECONDS = 0.05;
const PROJECTILE_SPAWN_OFFSET = 4;
const SPREAD_RADIANS = 0.16;

function getProjectileDef(context: FrameContext, projectileIndex: number): ProjectileDef | null {
  const projectiles = context.world.content.projectiles;
  if (!projectiles || !Array.isArray((projectiles as { defs?: unknown }).defs)) {
    return null;
  }

  return (projectiles as { defs: readonly ProjectileDef[] }).defs[projectileIndex] ?? null;
}

function resolveAimVector(
  context: FrameContext,
  targetSlot: number,
): { x: number; y: number } {
  const player = context.world.stores.player;
  if (targetSlot >= 0) {
    const enemies = ensureEnemyStore(context.world);
    const dx = enemies.posX[targetSlot] - player.posX;
    const dy = enemies.posY[targetSlot] - player.posY;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      return {
        x: dx / length,
        y: dy / length,
      };
    }
  }

  const facingLength = Math.hypot(player.facingX, player.facingY);
  if (facingLength > 0) {
    return {
      x: player.facingX / facingLength,
      y: player.facingY / facingLength,
    };
  }

  return { x: 1, y: 0 };
}

function rotateDirection(baseX: number, baseY: number, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: baseX * cos - baseY * sin,
    y: baseX * sin + baseY * cos,
  };
}

function fireProjectileBurst(
  context: FrameContext,
  projectileDef: Readonly<ProjectileDef>,
  projectileTypeId: number,
  shotCount: number,
  damage: number,
  pierceCount: number,
): boolean {
  const player = context.world.stores.player;
  const targetSlot = findNearestEnemySlot(context.world, player.posX, player.posY);
  if (targetSlot < 0) {
    return false;
  }

  const aim = resolveAimVector(context, targetSlot);
  const spreadCenter = (shotCount - 1) * 0.5;
  const projectileRadius = projectileDef.radius * player.statSnapshot.areaMultiplier;
  const projectileLifetime = projectileDef.lifetimeSeconds * player.statSnapshot.durationMultiplier;

  for (let shotIndex = 0; shotIndex < shotCount; shotIndex += 1) {
    const spreadOffset = (shotIndex - spreadCenter) * SPREAD_RADIANS;
    const shotDir = rotateDirection(aim.x, aim.y, spreadOffset);
    const spawnDistance = player.radius + projectileRadius + PROJECTILE_SPAWN_OFFSET;

    context.world.commands.projectileSpawn.enqueueValues(
      projectileTypeId,
      PLAYER_TEAM,
      player.posX + shotDir.x * spawnDistance,
      player.posY + shotDir.y * spawnDistance,
      shotDir.x * projectileDef.speed,
      shotDir.y * projectileDef.speed,
      projectileRadius,
      damage,
      projectileLifetime,
      pierceCount,
      projectileDef.collisionFlags,
    );
  }

  return true;
}

export function stepWeaponFire(context: FrameContext): void {
  const player = context.world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }

  const weapons = ensureWeaponRuntimeStore(context.world);
  if (weapons.activeCount === 0) {
    return;
  }

  for (let slot = 0; slot < weapons.activeCount; slot += 1) {
    const weaponDef = getWeaponDefByIndex(context.world.content, weapons.weaponTypeIds[slot]);
    if (!weaponDef) {
      continue;
    }

    const nextCooldown = Math.max(0, weapons.cooldownRemaining[slot] - context.dt);
    weapons.cooldownRemaining[slot] = nextCooldown;
    if (nextCooldown > 0) {
      continue;
    }

    if (weaponDef.behavior !== "projectile" || weaponDef.projectileIndex < 0) {
      weapons.cooldownRemaining[slot] = Math.max(
        MIN_WEAPON_COOLDOWN_SECONDS,
        weaponDef.baseCooldownSeconds * player.statSnapshot.cooldownMultiplier,
      );
      continue;
    }

    const projectileDef = getProjectileDef(context, weaponDef.projectileIndex);
    if (!projectileDef) {
      continue;
    }

    const shotCount = Math.max(1, weaponDef.shotsPerFire + Math.max(0, player.statSnapshot.projectileCount - 1));
    const damage = projectileDef.baseDamage * weaponDef.baseDamageMultiplier * player.statSnapshot.might;
    const didFire = fireProjectileBurst(
      context,
      projectileDef,
      weaponDef.projectileIndex,
      shotCount,
      damage,
      projectileDef.maxPierce + weaponDef.basePierceBonus,
    );

    if (!didFire) {
      continue;
    }

    weapons.cooldownRemaining[slot] = Math.max(
      MIN_WEAPON_COOLDOWN_SECONDS,
      weaponDef.baseCooldownSeconds * player.statSnapshot.cooldownMultiplier,
    );
  }
}

