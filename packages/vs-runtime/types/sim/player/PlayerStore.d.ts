import type { PlayerCharacterId } from "../content/ContentIds.ts";
import type { CharacterBaseStatsDef } from "../content/ContentTypes.ts";
import type { PlayerStatSnapshot } from "./PlayerStatSnapshot.ts";
import { type PlayerStatModifiers } from "./PlayerStats.ts";
export declare const DEFAULT_PLAYER_INVULNERABILITY_SECONDS = 0.5;
export interface PlayerStore {
    exists: boolean;
    isDead: boolean;
    characterId: PlayerCharacterId | null;
    posX: number;
    posY: number;
    velX: number;
    velY: number;
    facingX: number;
    facingY: number;
    radius: number;
    hp: number;
    maxHp: number;
    debugInvulnerable: boolean;
    invulnRemaining: number;
    invulnerabilityDurationSeconds: number;
    pickupRadius: number;
    baseStats: CharacterBaseStatsDef;
    statModifiers: PlayerStatModifiers;
    statSnapshot: PlayerStatSnapshot;
}
export declare function createPlayerStore(): PlayerStore;
//# sourceMappingURL=PlayerStore.d.ts.map