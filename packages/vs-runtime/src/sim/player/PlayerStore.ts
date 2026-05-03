import type { PlayerCharacterId } from "../content/ContentIds.ts";
import type { CharacterBaseStatsDef } from "../content/ContentTypes.ts";
import type { PlayerStatSnapshot } from "./PlayerStatSnapshot.ts";
import { DEFAULT_PLAYER_STAT_SNAPSHOT } from "./PlayerStatSnapshot.ts";
import {
  clonePlayerBaseStats,
  createPlayerStatModifiers,
  DEFAULT_PLAYER_BASE_STATS,
  type PlayerStatModifiers,
} from "./PlayerStats.ts";

export const DEFAULT_PLAYER_INVULNERABILITY_SECONDS = 0.5;

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

export function createPlayerStore(): PlayerStore {
  return {
    exists: false,
    isDead: false,
    characterId: null,
    posX: 0,
    posY: 0,
    velX: 0,
    velY: 0,
    facingX: 1,
    facingY: 0,
    radius: DEFAULT_PLAYER_STAT_SNAPSHOT.radius,
    hp: DEFAULT_PLAYER_STAT_SNAPSHOT.maxHp,
    maxHp: DEFAULT_PLAYER_STAT_SNAPSHOT.maxHp,
    debugInvulnerable: false,
    invulnRemaining: 0,
    invulnerabilityDurationSeconds: DEFAULT_PLAYER_INVULNERABILITY_SECONDS,
    pickupRadius: DEFAULT_PLAYER_STAT_SNAPSHOT.pickupRadius,
    baseStats: clonePlayerBaseStats(DEFAULT_PLAYER_BASE_STATS),
    statModifiers: createPlayerStatModifiers(),
    statSnapshot: { ...DEFAULT_PLAYER_STAT_SNAPSHOT },
  };
}
