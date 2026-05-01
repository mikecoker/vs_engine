import type {
  EnemyArchetypeId,
  PassiveUpgradeId,
  PickupId,
  PlayerCharacterId,
  ProgressionCurveId,
  ProjectileId,
  WaveId,
  WeaponId,
} from "./ContentIds.ts";

export interface BaseContentDef<TId extends string> {
  readonly id: TId;
  readonly displayName: string;
}

export type StatModifierKey =
  | "maxHp"
  | "moveSpeed"
  | "pickupRadius"
  | "might"
  | "cooldownMultiplier"
  | "durationMultiplier"
  | "areaMultiplier"
  | "projectileCount"
  | "armor"
  | "luck";

export interface StatModifierDef {
  readonly stat: StatModifierKey;
  readonly mode: "add" | "mul";
  readonly value: number;
}

export interface CharacterBaseStatsDef {
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly radius: number;
  readonly pickupRadius: number;
  readonly armor: number;
  readonly might: number;
  readonly cooldownMultiplier: number;
  readonly durationMultiplier: number;
  readonly areaMultiplier: number;
  readonly projectileCount: number;
  readonly luck: number;
}

export interface PlayerCharacterDef
  extends BaseContentDef<PlayerCharacterId> {
  readonly description: string;
  readonly spriteKey: string;
  readonly baseStats: CharacterBaseStatsDef;
  readonly starterWeaponIds: readonly WeaponId[];
}

export type EnemyBehaviorKind = "chase";

export interface EnemyArchetypeDef
  extends BaseContentDef<EnemyArchetypeId> {
  readonly spriteKey: string;
  readonly behavior: EnemyBehaviorKind;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly radius: number;
  readonly contactDamage: number;
  readonly xpValue: number;
  readonly collisionFlags: number;
}

export interface ProjectileDef extends BaseContentDef<ProjectileId> {
  readonly spriteKey: string;
  readonly radius: number;
  readonly speed: number;
  readonly baseDamage: number;
  readonly lifetimeSeconds: number;
  readonly maxPierce: number;
  readonly collisionFlags: number;
}

export type WeaponBehaviorKind = "projectile" | "aura" | "nova";

export interface WeaponDef extends BaseContentDef<WeaponId> {
  readonly description: string;
  readonly iconKey: string;
  readonly behavior: WeaponBehaviorKind;
  readonly maxLevel: number;
  readonly baseCooldownSeconds: number;
  readonly shotsPerFire: number;
  readonly targeting: "nearest_enemy" | "self";
  readonly projectileId: ProjectileId | null;
  readonly baseDamageMultiplier: number;
  readonly baseAreaRadius: number;
  readonly baseDurationSeconds: number;
  readonly basePierceBonus: number;
}

export interface PassiveUpgradeDef
  extends BaseContentDef<PassiveUpgradeId> {
  readonly description: string;
  readonly iconKey: string;
  readonly maxLevel: number;
  readonly modifiersByLevel: readonly (readonly StatModifierDef[])[];
}

export interface PickupDef extends BaseContentDef<PickupId> {
  readonly spriteKey: string;
  readonly radius: number;
  readonly magnetSpeed: number;
  readonly grantKind: "xp";
  readonly defaultValue: number;
}

export interface ProgressionCurveDef
  extends BaseContentDef<ProgressionCurveId> {
  readonly levelXpThresholds: readonly number[];
}

export interface WaveSpawnEntryDef {
  readonly enemyId: EnemyArchetypeId;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly intervalSeconds: number;
  readonly batchSize: number;
  readonly weight: number;
  readonly maxConcurrent: number;
}

export interface WaveDef extends BaseContentDef<WaveId> {
  readonly progressionCurveId: ProgressionCurveId;
  readonly spawnEntries: readonly WaveSpawnEntryDef[];
}

export interface ContentBundle {
  readonly playerCharacters: readonly PlayerCharacterDef[];
  readonly enemyArchetypes: readonly EnemyArchetypeDef[];
  readonly weapons: readonly WeaponDef[];
  readonly projectiles: readonly ProjectileDef[];
  readonly passiveUpgrades: readonly PassiveUpgradeDef[];
  readonly pickups: readonly PickupDef[];
  readonly progressionCurves: readonly ProgressionCurveDef[];
  readonly waves: readonly WaveDef[];
}

export type ContentCollectionName = keyof ContentBundle;
