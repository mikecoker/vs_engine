import type { CharacterBaseStatsDef, StatModifierDef, StatModifierKey } from "../content/ContentTypes";
import type { PlayerStatSnapshot } from "./PlayerStatSnapshot";
import { DEFAULT_PLAYER_STAT_SNAPSHOT } from "./PlayerStatSnapshot";

export type PlayerStatModifierValues = Record<StatModifierKey, number>;

export interface PlayerStatModifiers {
  readonly additive: PlayerStatModifierValues;
  readonly multiplicative: PlayerStatModifierValues;
}

const STAT_KEYS: readonly StatModifierKey[] = [
  "maxHp",
  "moveSpeed",
  "pickupRadius",
  "might",
  "cooldownMultiplier",
  "durationMultiplier",
  "areaMultiplier",
  "projectileCount",
  "armor",
  "luck",
] as const;

export const DEFAULT_PLAYER_BASE_STATS: Readonly<CharacterBaseStatsDef> = {
  maxHp: DEFAULT_PLAYER_STAT_SNAPSHOT.maxHp,
  moveSpeed: DEFAULT_PLAYER_STAT_SNAPSHOT.moveSpeed,
  radius: DEFAULT_PLAYER_STAT_SNAPSHOT.radius,
  pickupRadius: DEFAULT_PLAYER_STAT_SNAPSHOT.pickupRadius,
  armor: DEFAULT_PLAYER_STAT_SNAPSHOT.armor,
  might: DEFAULT_PLAYER_STAT_SNAPSHOT.might,
  cooldownMultiplier: DEFAULT_PLAYER_STAT_SNAPSHOT.cooldownMultiplier,
  durationMultiplier: DEFAULT_PLAYER_STAT_SNAPSHOT.durationMultiplier,
  areaMultiplier: DEFAULT_PLAYER_STAT_SNAPSHOT.areaMultiplier,
  projectileCount: DEFAULT_PLAYER_STAT_SNAPSHOT.projectileCount,
  luck: DEFAULT_PLAYER_STAT_SNAPSHOT.luck,
};

function createStatValueMap(seedValue: number): PlayerStatModifierValues {
  return {
    maxHp: seedValue,
    moveSpeed: seedValue,
    pickupRadius: seedValue,
    might: seedValue,
    cooldownMultiplier: seedValue,
    durationMultiplier: seedValue,
    areaMultiplier: seedValue,
    projectileCount: seedValue,
    armor: seedValue,
    luck: seedValue,
  };
}

export function clonePlayerBaseStats(
  baseStats: Readonly<CharacterBaseStatsDef>,
): CharacterBaseStatsDef {
  return {
    maxHp: baseStats.maxHp,
    moveSpeed: baseStats.moveSpeed,
    radius: baseStats.radius,
    pickupRadius: baseStats.pickupRadius,
    armor: baseStats.armor,
    might: baseStats.might,
    cooldownMultiplier: baseStats.cooldownMultiplier,
    durationMultiplier: baseStats.durationMultiplier,
    areaMultiplier: baseStats.areaMultiplier,
    projectileCount: baseStats.projectileCount,
    luck: baseStats.luck,
  };
}

export function createPlayerStatModifiers(): PlayerStatModifiers {
  return {
    additive: createStatValueMap(0),
    multiplicative: createStatValueMap(1),
  };
}

export function resetPlayerStatModifiers(modifiers: PlayerStatModifiers): void {
  for (const key of STAT_KEYS) {
    modifiers.additive[key] = 0;
    modifiers.multiplicative[key] = 1;
  }
}

export function applyPlayerStatModifier(
  modifiers: PlayerStatModifiers,
  modifier: Readonly<StatModifierDef>,
): void {
  if (modifier.mode === "add") {
    modifiers.additive[modifier.stat] += modifier.value;
    return;
  }

  modifiers.multiplicative[modifier.stat] *= modifier.value;
}

export function applyPlayerStatModifiers(
  modifiers: PlayerStatModifiers,
  modifierDefs: readonly Readonly<StatModifierDef>[],
): void {
  for (let index = 0; index < modifierDefs.length; index += 1) {
    applyPlayerStatModifier(modifiers, modifierDefs[index]);
  }
}

function clampMin(value: number, minimum: number): number {
  return value < minimum ? minimum : value;
}

function buildModifiedStat(
  baseValue: number,
  addValue: number,
  multiplier: number,
  minimum: number,
): number {
  return clampMin((baseValue + addValue) * multiplier, minimum);
}

export function rebuildPlayerStatSnapshot(
  baseStats: Readonly<CharacterBaseStatsDef>,
  modifiers: PlayerStatModifiers,
): PlayerStatSnapshot {
  return {
    maxHp: buildModifiedStat(baseStats.maxHp, modifiers.additive.maxHp, modifiers.multiplicative.maxHp, 1),
    moveSpeed: buildModifiedStat(
      baseStats.moveSpeed,
      modifiers.additive.moveSpeed,
      modifiers.multiplicative.moveSpeed,
      0,
    ),
    armor: (baseStats.armor + modifiers.additive.armor) * modifiers.multiplicative.armor,
    might: buildModifiedStat(baseStats.might, modifiers.additive.might, modifiers.multiplicative.might, 0),
    cooldownMultiplier: buildModifiedStat(
      baseStats.cooldownMultiplier,
      modifiers.additive.cooldownMultiplier,
      modifiers.multiplicative.cooldownMultiplier,
      0.05,
    ),
    durationMultiplier: buildModifiedStat(
      baseStats.durationMultiplier,
      modifiers.additive.durationMultiplier,
      modifiers.multiplicative.durationMultiplier,
      0,
    ),
    areaMultiplier: buildModifiedStat(
      baseStats.areaMultiplier,
      modifiers.additive.areaMultiplier,
      modifiers.multiplicative.areaMultiplier,
      0,
    ),
    projectileCount: Math.max(
      0,
      Math.round(
        (baseStats.projectileCount + modifiers.additive.projectileCount) *
          modifiers.multiplicative.projectileCount,
      ),
    ),
    pickupRadius: buildModifiedStat(
      baseStats.pickupRadius,
      modifiers.additive.pickupRadius,
      modifiers.multiplicative.pickupRadius,
      0,
    ),
    luck: (baseStats.luck + modifiers.additive.luck) * modifiers.multiplicative.luck,
    radius: clampMin(baseStats.radius, 1),
  };
}
