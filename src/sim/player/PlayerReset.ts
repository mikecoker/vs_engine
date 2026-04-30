import type { PlayerCharacterId } from "../content/ContentIds";
import type { ContentRegistry } from "../content/ContentRegistry";
import type { CharacterBaseStatsDef, PlayerCharacterDef } from "../content/ContentTypes";
import type { SimContent } from "../core/SimApi";
import type { PlayerStore } from "./PlayerStore";
import { clonePlayerBaseStats, DEFAULT_PLAYER_BASE_STATS, rebuildPlayerStatSnapshot, resetPlayerStatModifiers } from "./PlayerStats";

function isContentRegistry(content: SimContent): content is ContentRegistry {
  const candidate = content as Partial<ContentRegistry>;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof candidate.playerCharacters?.get === "function" &&
    Array.isArray(candidate.playerCharacters.defs)
  );
}

function resolvePlayerCharacterDef(
  content: SimContent,
  preferredPlayerId?: PlayerCharacterId,
): PlayerCharacterDef | null {
  if (!isContentRegistry(content)) {
    return null;
  }

  if (preferredPlayerId && content.playerCharacters.has(preferredPlayerId)) {
    return content.playerCharacters.get(preferredPlayerId);
  }

  return content.playerCharacters.defs[0] ?? null;
}

function applyBaseStats(store: PlayerStore, baseStats: Readonly<CharacterBaseStatsDef>): void {
  store.baseStats = clonePlayerBaseStats(baseStats);
  store.statSnapshot = rebuildPlayerStatSnapshot(store.baseStats, store.statModifiers);
  store.radius = store.statSnapshot.radius;
  store.maxHp = store.statSnapshot.maxHp;
  store.pickupRadius = store.statSnapshot.pickupRadius;
  store.hp = Math.min(store.hp, store.maxHp);
}

export function rebuildPlayerRuntimeStats(store: PlayerStore): void {
  const previousMaxHp = store.maxHp;
  const previousHpRatio = previousMaxHp > 0 ? store.hp / previousMaxHp : 1;

  store.statSnapshot = rebuildPlayerStatSnapshot(store.baseStats, store.statModifiers);
  store.radius = store.statSnapshot.radius;
  store.maxHp = store.statSnapshot.maxHp;
  store.pickupRadius = store.statSnapshot.pickupRadius;
  store.hp = Math.min(store.maxHp, Math.max(0, previousHpRatio * store.maxHp));
}

export function resetPlayerStore(store: PlayerStore): void {
  store.exists = false;
  store.isDead = false;
  store.characterId = null;
  store.posX = 0;
  store.posY = 0;
  store.velX = 0;
  store.velY = 0;
  store.facingX = 1;
  store.facingY = 0;
  store.invulnRemaining = 0;
  resetPlayerStatModifiers(store.statModifiers);
  applyBaseStats(store, DEFAULT_PLAYER_BASE_STATS);
  store.hp = store.maxHp;
}

export function initializePlayerForRun(
  store: PlayerStore,
  content: SimContent,
  preferredPlayerId?: PlayerCharacterId,
): void {
  resetPlayerStore(store);

  const playerDef = resolvePlayerCharacterDef(content, preferredPlayerId);
  if (playerDef) {
    store.characterId = playerDef.id;
    applyBaseStats(store, playerDef.baseStats);
  }

  store.exists = true;
  store.isDead = false;
  store.hp = store.maxHp;
}
