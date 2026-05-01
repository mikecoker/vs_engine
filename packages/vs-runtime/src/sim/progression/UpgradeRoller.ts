import type { ContentRegistry } from "../content/ContentRegistry";
import type { PassiveUpgradeDef, WeaponDef } from "../content/ContentTypes";
import { ensureWeaponRuntimeStore } from "../combat/WeaponRuntimeStore";
import type { World } from "../world/World";
import type { ProgressionStore } from "./ProgressionStore";
import { MAX_UPGRADE_CHOICES, type UpgradeChoice } from "./UpgradeChoice";

interface WeightedUpgradeCandidate {
  readonly choice: UpgradeChoice;
  readonly weight: number;
}

function isContentRegistry(content: World["content"]): content is World["content"] & ContentRegistry {
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

function createPassiveChoice(
  passiveDef: Readonly<PassiveUpgradeDef>,
  passiveIndex: number,
  currentLevel: number,
): UpgradeChoice {
  const nextLevel = currentLevel + 1;
  return {
    choiceId: `passive:${passiveDef.id}:${nextLevel}`,
    kind: "passive",
    contentIndex: passiveIndex,
    contentId: passiveDef.id,
    displayName: passiveDef.displayName,
    description: passiveDef.description,
    iconKey: passiveDef.iconKey,
    currentLevel,
    nextLevel,
    maxLevel: passiveDef.maxLevel,
  };
}

function createWeaponUnlockChoice(
  weaponDef: Readonly<WeaponDef>,
  weaponIndex: number,
): UpgradeChoice {
  return {
    choiceId: `weapon_unlock:${weaponDef.id}`,
    kind: "weapon_unlock",
    contentIndex: weaponIndex,
    contentId: weaponDef.id,
    displayName: weaponDef.displayName,
    description: weaponDef.description,
    iconKey: weaponDef.iconKey,
    currentLevel: 0,
    nextLevel: 1,
    maxLevel: weaponDef.maxLevel,
  };
}

function createWeaponLevelChoice(
  weaponDef: Readonly<WeaponDef>,
  weaponIndex: number,
  currentLevel: number,
): UpgradeChoice {
  return {
    choiceId: `weapon_level:${weaponDef.id}:${currentLevel + 1}`,
    kind: "weapon_level",
    contentIndex: weaponIndex,
    contentId: weaponDef.id,
    displayName: weaponDef.displayName,
    description: weaponDef.description,
    iconKey: weaponDef.iconKey,
    currentLevel,
    nextLevel: currentLevel + 1,
    maxLevel: weaponDef.maxLevel,
  };
}

function buildWeaponSlotMap(weaponTypeIds: Uint16Array, activeCount: number, weaponCount: number): Int16Array {
  const slotsByType = new Int16Array(weaponCount);
  slotsByType.fill(-1);

  for (let slot = 0; slot < activeCount; slot += 1) {
    slotsByType[weaponTypeIds[slot]] = slot;
  }

  return slotsByType;
}

function buildCandidates(world: World, progression: ProgressionStore): WeightedUpgradeCandidate[] {
  if (!isContentRegistry(world.content)) {
    return [];
  }

  const candidates: WeightedUpgradeCandidate[] = [];
  const weaponStore = ensureWeaponRuntimeStore(world);
  const weaponDefs = world.content.weapons.defs;
  const weaponSlotsByType = buildWeaponSlotMap(
    weaponStore.weaponTypeIds,
    weaponStore.activeCount,
    weaponDefs.length,
  );
  const maxWeaponSlots = Math.min(weaponDefs.length, 3);

  for (let passiveIndex = 0; passiveIndex < world.content.passiveUpgrades.defs.length; passiveIndex += 1) {
    const passiveDef = world.content.passiveUpgrades.defs[passiveIndex];
    const currentLevel = progression.passiveUpgradeLevels[passiveIndex] ?? 0;
    if (currentLevel >= passiveDef.maxLevel) {
      continue;
    }

    candidates.push({
      choice: createPassiveChoice(passiveDef, passiveIndex, currentLevel),
      weight: 1.2,
    });
  }

  for (let weaponIndex = 0; weaponIndex < weaponDefs.length; weaponIndex += 1) {
    const weaponDef = weaponDefs[weaponIndex];
    const weaponSlot = weaponSlotsByType[weaponIndex];
    if (weaponSlot >= 0) {
      const currentLevel = weaponStore.weaponLevels[weaponSlot] ?? 0;
      if (currentLevel < weaponDef.maxLevel) {
        candidates.push({
          choice: createWeaponLevelChoice(weaponDef, weaponIndex, currentLevel),
          weight: 1.5,
        });
      }
      continue;
    }

    if (weaponStore.activeCount >= maxWeaponSlots) {
      continue;
    }

    candidates.push({
      choice: createWeaponUnlockChoice(weaponDef, weaponIndex),
      weight: weaponDef.behavior === "projectile" ? 1.4 : 0.8,
    });
  }

  return candidates;
}

function chooseCandidateIndex(
  candidates: readonly WeightedUpgradeCandidate[],
  roll: number,
): number {
  let totalWeight = 0;
  for (let index = 0; index < candidates.length; index += 1) {
    totalWeight += candidates[index].weight;
  }

  if (totalWeight <= 0) {
    return 0;
  }

  let cursor = roll * totalWeight;
  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= candidates[index].weight;
    if (cursor <= 0) {
      return index;
    }
  }

  return candidates.length - 1;
}

export function rollUpgradeChoices(
  world: World,
  progression: ProgressionStore,
  maxChoices = MAX_UPGRADE_CHOICES,
): readonly UpgradeChoice[] {
  const candidates = buildCandidates(world, progression);
  const selectedChoices: UpgradeChoice[] = [];

  while (candidates.length > 0 && selectedChoices.length < maxChoices) {
    const candidateIndex = chooseCandidateIndex(candidates, world.rng.next());
    const [candidate] = candidates.splice(candidateIndex, 1);
    if (!candidate) {
      break;
    }

    selectedChoices.push(candidate.choice);
  }

  progression.currentChoices.length = 0;
  progression.currentChoices.push(...selectedChoices);
  return progression.currentChoices;
}
