export type ContentId<TPrefix extends string> = `${TPrefix}.${string}`;
export type PlayerCharacterId = ContentId<"player">;
export type EnemyArchetypeId = ContentId<"enemy">;
export type WeaponId = ContentId<"weapon">;
export type ProjectileId = ContentId<"projectile">;
export type PassiveUpgradeId = ContentId<"passive">;
export type PickupId = ContentId<"pickup">;
export type ProgressionCurveId = ContentId<"progression">;
export type WaveId = ContentId<"wave">;
export type AnyContentId = PlayerCharacterId | EnemyArchetypeId | WeaponId | ProjectileId | PassiveUpgradeId | PickupId | ProgressionCurveId | WaveId;
export declare function playerCharacterId(rawId: string): PlayerCharacterId;
export declare function enemyArchetypeId(rawId: string): EnemyArchetypeId;
export declare function weaponId(rawId: string): WeaponId;
export declare function projectileId(rawId: string): ProjectileId;
export declare function passiveUpgradeId(rawId: string): PassiveUpgradeId;
export declare function pickupId(rawId: string): PickupId;
export declare function progressionCurveId(rawId: string): ProgressionCurveId;
export declare function waveId(rawId: string): WaveId;
//# sourceMappingURL=ContentIds.d.ts.map