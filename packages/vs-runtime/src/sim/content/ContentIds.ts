export type ContentId<TPrefix extends string> = `${TPrefix}.${string}`;

export type PlayerCharacterId = ContentId<"player">;
export type EnemyArchetypeId = ContentId<"enemy">;
export type WeaponId = ContentId<"weapon">;
export type ProjectileId = ContentId<"projectile">;
export type PassiveUpgradeId = ContentId<"passive">;
export type PickupId = ContentId<"pickup">;
export type ProgressionCurveId = ContentId<"progression">;
export type WaveId = ContentId<"wave">;

export type AnyContentId =
  | PlayerCharacterId
  | EnemyArchetypeId
  | WeaponId
  | ProjectileId
  | PassiveUpgradeId
  | PickupId
  | ProgressionCurveId
  | WaveId;

function makeContentId<TPrefix extends string, TId extends ContentId<TPrefix>>(
  expectedPrefix: TPrefix,
  rawId: string,
): TId {
  if (!rawId.startsWith(`${expectedPrefix}.`)) {
    throw new Error(
      `Content ID "${rawId}" must use the "${expectedPrefix}." prefix.`,
    );
  }

  return rawId as TId;
}

export function playerCharacterId(rawId: string): PlayerCharacterId {
  return makeContentId("player", rawId);
}

export function enemyArchetypeId(rawId: string): EnemyArchetypeId {
  return makeContentId("enemy", rawId);
}

export function weaponId(rawId: string): WeaponId {
  return makeContentId("weapon", rawId);
}

export function projectileId(rawId: string): ProjectileId {
  return makeContentId("projectile", rawId);
}

export function passiveUpgradeId(rawId: string): PassiveUpgradeId {
  return makeContentId("passive", rawId);
}

export function pickupId(rawId: string): PickupId {
  return makeContentId("pickup", rawId);
}

export function progressionCurveId(rawId: string): ProgressionCurveId {
  return makeContentId("progression", rawId);
}

export function waveId(rawId: string): WaveId {
  return makeContentId("wave", rawId);
}
