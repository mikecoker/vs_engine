import type { ContentRegistry } from "../content/ContentRegistry.ts";
import { ensureWeaponRuntimeStore } from "../combat/WeaponRuntimeStore.ts";
import type { SimContent } from "../core/SimApi.ts";
import { applyPlayerStatModifiers } from "../player/PlayerStats.ts";
import { rebuildPlayerRuntimeStats } from "../player/PlayerReset.ts";
import type { World } from "../world/World.ts";
import type { ProgressionStore } from "./ProgressionStore.ts";
import type { UpgradeChoice } from "./UpgradeChoice.ts";

function isContentRegistry(content: SimContent): content is SimContent & ContentRegistry {
  const registry = content as Partial<ContentRegistry>;
  return (
    typeof content === "object" &&
    content !== null &&
    !!registry.weapons &&
    !!registry.passiveUpgrades &&
    Array.isArray(registry.weapons.defs) &&
    Array.isArray(registry.passiveUpgrades.defs)
  );
}

function findWeaponSlotByType(world: World, weaponTypeId: number): number {
  const weapons = ensureWeaponRuntimeStore(world);
  for (let slot = 0; slot < weapons.activeCount; slot += 1) {
    if (weapons.weaponTypeIds[slot] === weaponTypeId) {
      return slot;
    }
  }

  return -1;
}

function applyPassiveUpgrade(world: World, progression: ProgressionStore, choice: UpgradeChoice): boolean {
  if (!isContentRegistry(world.content)) {
    return false;
  }

  const passiveDef = world.content.passiveUpgrades.defs[choice.contentIndex];
  if (!passiveDef) {
    return false;
  }

  const currentLevel = progression.passiveUpgradeLevels[choice.contentIndex] ?? 0;
  if (currentLevel >= passiveDef.maxLevel) {
    return false;
  }

  progression.passiveUpgradeLevels[choice.contentIndex] = currentLevel + 1;
  const modifiers = passiveDef.modifiersByLevel[currentLevel] ?? [];
  applyPlayerStatModifiers(world.stores.player.statModifiers, modifiers);
  rebuildPlayerRuntimeStats(world.stores.player);
  return true;
}

function applyWeaponUnlock(world: World, choice: UpgradeChoice): boolean {
  if (!isContentRegistry(world.content)) {
    return false;
  }

  const weaponDef = world.content.weapons.defs[choice.contentIndex];
  if (!weaponDef) {
    return false;
  }

  const weapons = ensureWeaponRuntimeStore(world);
  if (findWeaponSlotByType(world, choice.contentIndex) >= 0) {
    return false;
  }

  weapons.ensureCapacity(weapons.activeCount + 1);
  const slot = weapons.activeCount;
  weapons.weaponTypeIds[slot] = choice.contentIndex;
  weapons.weaponLevels[slot] = 1;
  weapons.cooldownRemaining[slot] = 0;
  weapons.activeCount += 1;
  return true;
}

function applyWeaponLevel(world: World, choice: UpgradeChoice): boolean {
  if (!isContentRegistry(world.content)) {
    return false;
  }

  const weaponDef = world.content.weapons.defs[choice.contentIndex];
  if (!weaponDef) {
    return false;
  }

  const slot = findWeaponSlotByType(world, choice.contentIndex);
  if (slot < 0) {
    return false;
  }

  const weapons = ensureWeaponRuntimeStore(world);
  const currentLevel = weapons.weaponLevels[slot] ?? 0;
  if (currentLevel >= weaponDef.maxLevel) {
    return false;
  }

  weapons.weaponLevels[slot] = currentLevel + 1;
  return true;
}

export function applyUpgradeChoice(
  world: World,
  progression: ProgressionStore,
  choice: UpgradeChoice,
): boolean {
  switch (choice.kind) {
    case "passive":
      return applyPassiveUpgrade(world, progression, choice);
    case "weapon_unlock":
      return applyWeaponUnlock(world, choice);
    case "weapon_level":
      return applyWeaponLevel(world, choice);
    default:
      return false;
  }
}
