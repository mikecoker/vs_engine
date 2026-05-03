import type { EnemyArchetypeId, PassiveUpgradeId, PickupId, PlayerCharacterId, ProgressionCurveId, ProjectileId, WaveId, WeaponId } from "./ContentIds.ts";
import type { ContentBundle, EnemyArchetypeDef, PassiveUpgradeDef, PickupDef, PlayerCharacterDef, ProgressionCurveDef, ProjectileDef, WaveDef, WeaponDef } from "./ContentTypes.ts";
export interface ContentTable<TId extends string, TDef extends {
    id: TId;
}> {
    readonly ids: readonly TId[];
    readonly defs: readonly TDef[];
    readonly byId: ReadonlyMap<TId, TDef>;
    readonly indexById: ReadonlyMap<TId, number>;
    get(id: TId): TDef;
    getIndex(id: TId): number;
    has(id: TId): boolean;
}
export interface ContentRegistry {
    readonly playerCharacters: ContentTable<PlayerCharacterId, PlayerCharacterDef>;
    readonly enemyArchetypes: ContentTable<EnemyArchetypeId, EnemyArchetypeDef>;
    readonly weapons: ContentTable<WeaponId, WeaponDef>;
    readonly projectiles: ContentTable<ProjectileId, ProjectileDef>;
    readonly passiveUpgrades: ContentTable<PassiveUpgradeId, PassiveUpgradeDef>;
    readonly pickups: ContentTable<PickupId, PickupDef>;
    readonly progressionCurves: ContentTable<ProgressionCurveId, ProgressionCurveDef>;
    readonly waves: ContentTable<WaveId, WaveDef>;
    readonly bundle: Readonly<ContentBundle>;
}
export declare function createContentRegistry(bundle: ContentBundle): ContentRegistry;
//# sourceMappingURL=ContentRegistry.d.ts.map