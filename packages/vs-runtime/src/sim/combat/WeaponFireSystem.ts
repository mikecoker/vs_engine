import type { ProjectileDef } from "../content/ContentTypes.ts";
import type { FrameContext } from "../core/FrameContext.ts";
import { ensureEnemyStore } from "../enemies/EnemyStore.ts";
import { getWeaponDefByIndex } from "./WeaponRuntimeContent.ts";
import { PLAYER_TEAM } from "./DamageTypes.ts";
import { ensureWeaponRuntimeStore } from "./WeaponRuntimeStore.ts";
import { findNearestEnemySlot } from "./WeaponTargeting.ts";

const MIN_WEAPON_COOLDOWN_SECONDS = 0.05;
const PROJECTILE_SPAWN_OFFSET = 4;
const SPREAD_RADIANS = 0.16;
const WEAPON_LEVEL_DAMAGE_BONUS = 0.15;
const WEAPON_LEVEL_AREA_BONUS = 0.1;
const WEAPON_LEVEL_COOLDOWN_BONUS = 0.04;

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

function getWeaponLevelBonusMultiplier(level: number, perLevelBonus: number): number {
  return 1 + Math.max(0, level - 1) * perLevelBonus;
}

function getWeaponCooldownSeconds(baseCooldownSeconds: number, level: number, cooldownMultiplier: number): number {
  const levelScale = Math.max(0.5, 1 - Math.max(0, level - 1) * WEAPON_LEVEL_COOLDOWN_BONUS);
  return Math.max(
    MIN_WEAPON_COOLDOWN_SECONDS,
    baseCooldownSeconds * levelScale * cooldownMultiplier,
  );
}

function computeWeaponDamage(baseDamage: number, level: number, might: number): number {
  return baseDamage * getWeaponLevelBonusMultiplier(level, WEAPON_LEVEL_DAMAGE_BONUS) * might;
}

function computeWeaponArea(baseAreaRadius: number, level: number, areaMultiplier: number): number {
  return baseAreaRadius * getWeaponLevelBonusMultiplier(level, WEAPON_LEVEL_AREA_BONUS) * areaMultiplier;
}

function applyAreaDamage(
  context: FrameContext,
  centerX: number,
  centerY: number,
  radius: number,
  damage: number,
  sourceId: number,
): boolean {
  if (radius <= 0 || damage <= 0) {
    return false;
  }

  const enemies = ensureEnemyStore(context.world);
  let hitAny = false;

  for (let denseIndex = 0; denseIndex < enemies.activeCount; denseIndex += 1) {
    const slot = enemies.activeSlots[denseIndex];
    const dx = enemies.posX[slot] - centerX;
    const dy = enemies.posY[slot] - centerY;
    const hitRadius = radius + enemies.radius[slot];
    if (dx * dx + dy * dy > hitRadius * hitRadius) {
      continue;
    }

    context.world.commands.damage.enqueue(
      "enemy",
      slot,
      damage,
      "projectile",
      sourceId,
    );
    hitAny = true;
  }

  return hitAny;
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

    const weaponLevel = Math.max(1, weapons.weaponLevels[slot] ?? 1);

    const nextCooldown = Math.max(0, weapons.cooldownRemaining[slot] - context.dt);
    weapons.cooldownRemaining[slot] = nextCooldown;
    if (nextCooldown > 0) {
      continue;
    }

    let didFire = false;

    if (weaponDef.behavior === "projectile" && weaponDef.projectileIndex >= 0) {
      const projectileDef = getProjectileDef(context, weaponDef.projectileIndex);
      if (!projectileDef) {
        continue;
      }

      const shotCount = Math.max(
        1,
        weaponDef.shotsPerFire +
          Math.floor((weaponLevel - 1) / 2) +
          Math.max(0, player.statSnapshot.projectileCount - 1),
      );
      const damage = computeWeaponDamage(
        projectileDef.baseDamage * weaponDef.baseDamageMultiplier,
        weaponLevel,
        player.statSnapshot.might,
      );
      didFire = fireProjectileBurst(
        context,
        projectileDef,
        weaponDef.projectileIndex,
        shotCount,
        damage,
        projectileDef.maxPierce + weaponDef.basePierceBonus,
      );
    } else if (weaponDef.behavior === "aura") {
      const radius = computeWeaponArea(
        player.radius + weaponDef.baseAreaRadius,
        weaponLevel,
        player.statSnapshot.areaMultiplier,
      );
      const damage = computeWeaponDamage(
        10 * weaponDef.baseDamageMultiplier,
        weaponLevel,
        player.statSnapshot.might,
      );
      didFire = applyAreaDamage(context, player.posX, player.posY, radius, damage, slot);
    } else if (weaponDef.behavior === "nova") {
      const radius = computeWeaponArea(
        player.radius + weaponDef.baseAreaRadius,
        weaponLevel,
        player.statSnapshot.areaMultiplier,
      );
      const damage = computeWeaponDamage(
        14 * weaponDef.baseDamageMultiplier,
        weaponLevel,
        player.statSnapshot.might,
      );
      didFire = applyAreaDamage(context, player.posX, player.posY, radius, damage, slot);
    }

    weapons.cooldownRemaining[slot] = didFire
      ? getWeaponCooldownSeconds(
          weaponDef.baseCooldownSeconds,
          weaponLevel,
          player.statSnapshot.cooldownMultiplier,
        )
      : Math.max(0.1, Math.min(0.25, weaponDef.baseCooldownSeconds * 0.2));
    if (didFire) {
      weapons.lastFireElapsedSeconds[slot] = context.world.time.elapsedSeconds;
    }
  }
}
