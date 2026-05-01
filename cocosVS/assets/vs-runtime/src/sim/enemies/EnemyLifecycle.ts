import type { World } from "../world/World.ts";
import { ensureEnemyStore } from "./EnemyStore.ts";

export interface EnemyDeathInfo {
  readonly slot: number;
  readonly archetypeIndex: number;
  readonly x: number;
  readonly y: number;
  readonly xpValue: number;
}

export function createEnemyDeathInfo(world: World, slot: number): EnemyDeathInfo | null {
  const store = ensureEnemyStore(world);
  if (!store.isAlive(slot)) {
    return null;
  }

  return {
    slot,
    archetypeIndex: store.typeIds[slot],
    x: store.posX[slot],
    y: store.posY[slot],
    xpValue: store.xpValue[slot],
  };
}

export function releaseEnemy(world: World, slot: number): boolean {
  const store = ensureEnemyStore(world);
  return store.release(slot);
}
