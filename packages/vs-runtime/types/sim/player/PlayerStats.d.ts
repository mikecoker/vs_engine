import type { CharacterBaseStatsDef, StatModifierDef, StatModifierKey } from "../content/ContentTypes.ts";
import type { PlayerStatSnapshot } from "./PlayerStatSnapshot.ts";
export type PlayerStatModifierValues = Record<StatModifierKey, number>;
export interface PlayerStatModifiers {
    readonly additive: PlayerStatModifierValues;
    readonly multiplicative: PlayerStatModifierValues;
}
export declare const DEFAULT_PLAYER_BASE_STATS: Readonly<CharacterBaseStatsDef>;
export declare function clonePlayerBaseStats(baseStats: Readonly<CharacterBaseStatsDef>): CharacterBaseStatsDef;
export declare function createPlayerStatModifiers(): PlayerStatModifiers;
export declare function resetPlayerStatModifiers(modifiers: PlayerStatModifiers): void;
export declare function applyPlayerStatModifier(modifiers: PlayerStatModifiers, modifier: Readonly<StatModifierDef>): void;
export declare function applyPlayerStatModifiers(modifiers: PlayerStatModifiers, modifierDefs: readonly Readonly<StatModifierDef>[]): void;
export declare function rebuildPlayerStatSnapshot(baseStats: Readonly<CharacterBaseStatsDef>, modifiers: PlayerStatModifiers): PlayerStatSnapshot;
//# sourceMappingURL=PlayerStats.d.ts.map