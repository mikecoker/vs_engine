import type { World } from "../world/World.ts";
import { DEFAULT_SIM_BOUNDS } from "../core/SimConfig.ts";
import {
  getDefaultEnemyWave,
  getEnemyRuntimeContent,
  type EnemyWaveRuntimeDef,
} from "./EnemyArchetypeRuntime.ts";
import { ensureEnemyStore, forEachActiveEnemySlot } from "./EnemyStore.ts";

export const DEFAULT_SPAWN_SAFE_RADIUS = 340;
export const DEFAULT_SPAWN_RING_THICKNESS = 180;
export const DEFAULT_MAX_ACTIVE_ENEMIES = 500;
export const DEFAULT_EDGE_SPAWN_MARGIN = 220;

export interface SpawnDirectorState {
  initialized: boolean;
  waveContentIndex: number;
  maxActiveEnemies: number;
  safeRadius: number;
  ringThickness: number;
  nextSpawnAtSeconds: Float32Array;
  activeCountsByType: Uint16Array;
}

declare module "../world/World" {
  interface WorldScratch {
    enemySpawnDirector?: SpawnDirectorState;
  }
}

function createSpawnDirectorState(wave: EnemyWaveRuntimeDef | null): SpawnDirectorState {
  return {
    initialized: false,
    waveContentIndex: wave?.contentIndex ?? -1,
    maxActiveEnemies: DEFAULT_MAX_ACTIVE_ENEMIES,
    safeRadius: DEFAULT_SPAWN_SAFE_RADIUS,
    ringThickness: DEFAULT_SPAWN_RING_THICKNESS,
    nextSpawnAtSeconds: new Float32Array(wave?.spawnEntries.length ?? 0),
    activeCountsByType: new Uint16Array(0),
  };
}

export function ensureSpawnDirector(world: World): SpawnDirectorState {
  const defaultWave = getDefaultEnemyWave(world.content);
  let director = world.scratch.enemySpawnDirector;

  if (!director) {
    director = createSpawnDirectorState(defaultWave);
    world.scratch.enemySpawnDirector = director;
  }

  if (
    defaultWave &&
    (director.waveContentIndex !== defaultWave.contentIndex ||
      director.nextSpawnAtSeconds.length !== defaultWave.spawnEntries.length)
  ) {
    director.waveContentIndex = defaultWave.contentIndex;
    director.nextSpawnAtSeconds = new Float32Array(defaultWave.spawnEntries.length);
    director.initialized = false;
  }

  return director;
}

function initializeSpawnTimes(director: SpawnDirectorState, wave: EnemyWaveRuntimeDef): void {
  for (let entryIndex = 0; entryIndex < wave.spawnEntries.length; entryIndex += 1) {
    director.nextSpawnAtSeconds[entryIndex] = wave.spawnEntries[entryIndex].startSeconds;
  }
  director.initialized = true;
}

function ensureActiveCountBuffer(
  director: SpawnDirectorState,
  requiredSize: number,
): Uint16Array {
  if (director.activeCountsByType.length < requiredSize) {
    director.activeCountsByType = new Uint16Array(requiredSize);
  } else {
    director.activeCountsByType.fill(0);
  }

  return director.activeCountsByType;
}

export function countActiveEnemiesByArchetype(world: World, requiredSize: number): Uint16Array {
  const director = ensureSpawnDirector(world);
  const counts = ensureActiveCountBuffer(director, requiredSize);
  const store = ensureEnemyStore(world);

  forEachActiveEnemySlot(store, (slot) => {
    const archetypeIndex = store.typeIds[slot];
    if (archetypeIndex < counts.length) {
      counts[archetypeIndex] += 1;
    }
  });

  return counts;
}

export function sampleOffscreenSpawnPoint(world: World, safeRadius: number, ringThickness: number): {
  x: number;
  y: number;
} {
  const player = world.stores.player;
  const centerX = player.exists ? player.posX : 0;
  const centerY = player.exists ? player.posY : 0;
  const radius = safeRadius + world.rng.next() * ringThickness;
  const angle = world.rng.next() * Math.PI * 2;

  const spawnBounds = world.config.bounds?.spawn ?? DEFAULT_SIM_BOUNDS.spawn;
  const playerBounds = world.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player;
  const edgeBounds = {
    minX: Math.max(spawnBounds.minX, playerBounds.minX - DEFAULT_EDGE_SPAWN_MARGIN),
    maxX: Math.min(spawnBounds.maxX, playerBounds.maxX + DEFAULT_EDGE_SPAWN_MARGIN),
    minY: Math.max(spawnBounds.minY, playerBounds.minY - DEFAULT_EDGE_SPAWN_MARGIN),
    maxY: Math.min(spawnBounds.maxY, playerBounds.maxY + DEFAULT_EDGE_SPAWN_MARGIN),
  };

  return {
    x: Math.max(edgeBounds.minX, Math.min(edgeBounds.maxX, centerX + Math.cos(angle) * radius)),
    y: Math.max(edgeBounds.minY, Math.min(edgeBounds.maxY, centerY + Math.sin(angle) * radius)),
  };
}

export function stepSpawnDirector(world: World, elapsedSeconds: number): void {
  const wave = getDefaultEnemyWave(world.content);
  if (!wave) {
    return;
  }

  const director = ensureSpawnDirector(world);
  if (!director.initialized || world.time.tick <= 1) {
    initializeSpawnTimes(director, wave);
  }

  const store = ensureEnemyStore(world);
  if (store.activeCount >= director.maxActiveEnemies) {
    return;
  }

  const runtimeContent = getEnemyRuntimeContent(world.content);
  const activeCounts = countActiveEnemiesByArchetype(
    world,
    runtimeContent?.archetypes.length ?? wave.spawnEntries.length,
  );
  const spawnCapacityRemaining = director.maxActiveEnemies - store.activeCount;
  let queuedThisTick = 0;

  for (let entryIndex = 0; entryIndex < wave.spawnEntries.length; entryIndex += 1) {
    const entry = wave.spawnEntries[entryIndex];
    if (elapsedSeconds < entry.startSeconds || elapsedSeconds > entry.endSeconds) {
      continue;
    }

    while (
      elapsedSeconds >= director.nextSpawnAtSeconds[entryIndex] &&
      queuedThisTick < spawnCapacityRemaining &&
      activeCounts[entry.enemyIndex] < entry.maxConcurrent
    ) {
      const remainingByArchetype = entry.maxConcurrent - activeCounts[entry.enemyIndex];
      const remainingGlobal = spawnCapacityRemaining - queuedThisTick;
      const batchCount = Math.min(entry.batchSize, remainingByArchetype, remainingGlobal);

      for (let count = 0; count < batchCount; count += 1) {
        const spawnPoint = sampleOffscreenSpawnPoint(
          world,
          director.safeRadius,
          director.ringThickness,
        );
        world.commands.enemySpawn.enqueue(entry.enemyIndex, spawnPoint.x, spawnPoint.y);
        queuedThisTick += 1;
        activeCounts[entry.enemyIndex] += 1;
      }

      director.nextSpawnAtSeconds[entryIndex] += entry.intervalSeconds;
      if (batchCount === 0) {
        break;
      }
    }
  }
}
