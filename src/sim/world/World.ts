import type { SimContent } from "../core/SimApi";
import type { SimConfig } from "../core/SimConfig";
import {
  DamageBuffer,
  DespawnBuffer,
  EnemySpawnBuffer,
  PickupSpawnBuffer,
  ProjectileSpawnBuffer,
  StateChangeBuffer,
  XpGrantBuffer,
} from "../core/commands";
import { createDebugCounters, type DebugCounters } from "../debug/DebugSnapshot";
import type { RunState } from "../core/RunState";
import { createPlayerStore, type PlayerStore } from "../player/PlayerStore";
import {
  createEnemyStoreFromPlaceholder,
  type EnemyStore,
} from "../enemies/EnemyStore";
import {
  createProjectileStoreFromPlaceholder,
  type ProjectileStore,
} from "../projectiles/ProjectileStore";
import {
  createPickupStoreFromPlaceholder,
  type PickupStore,
} from "../pickups/PickupStore";
import {
  createProgressionStore,
  resolvePassiveUpgradeCount,
  type ProgressionStore,
} from "../progression/ProgressionStore";

export interface DynamicWorldStore {
  capacity: number;
  activeCount: number;
  activeMask: Uint8Array;
  generation: Uint16Array;
  typeIds: Uint16Array;
  posX: Float32Array;
  posY: Float32Array;
  reset(): void;
}

export interface WorldStores {
  player: PlayerStore;
  enemies: EnemyStore;
  projectiles: ProjectileStore;
  pickups: PickupStore;
  progression: ProgressionStore;
}

export interface WorldCommands {
  enemySpawn: EnemySpawnBuffer;
  projectileSpawn: ProjectileSpawnBuffer;
  pickupSpawn: PickupSpawnBuffer;
  damage: DamageBuffer;
  xpGrant: XpGrantBuffer;
  despawn: DespawnBuffer;
  stateChange: StateChangeBuffer;
}

export interface WorldScratch {
  latestMoveMagnitude: number;
}

export interface WorldTimeState {
  tick: number;
  elapsedSeconds: number;
}

export interface RunStateRuntime {
  current: RunState;
}

export interface World {
  readonly config: Readonly<SimConfig>;
  readonly content: SimContent;
  seed: number;
  readonly rng: WorldRng;
  readonly runState: RunStateRuntime;
  readonly time: WorldTimeState;
  readonly stores: WorldStores;
  readonly commands: WorldCommands;
  readonly scratch: WorldScratch;
  readonly debug: DebugCounters;
}

export interface WorldRng {
  seed: number;
  next(): number;
  reset(seed: number): void;
}

export function createWorldRng(seed: number): WorldRng {
  let state = seed >>> 0;

  return {
    get seed() {
      return state >>> 0;
    },
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    reset(nextSeed: number) {
      state = nextSeed >>> 0;
    },
  };
}

export function createDynamicWorldStore(capacity: number): DynamicWorldStore {
  return {
    capacity,
    activeCount: 0,
    activeMask: new Uint8Array(capacity),
    generation: new Uint16Array(capacity),
    typeIds: new Uint16Array(capacity),
    posX: new Float32Array(capacity),
    posY: new Float32Array(capacity),
    reset() {
      this.activeCount = 0;
      this.activeMask.fill(0);
      this.typeIds.fill(0);
      this.posX.fill(0);
      this.posY.fill(0);
    },
  };
}

export function createWorldStores(
  config: Readonly<SimConfig>,
  content: SimContent,
): WorldStores {
  return {
    player: createPlayerStore(),
    enemies: createEnemyStoreFromPlaceholder(createDynamicWorldStore(config.capacities.enemies)),
    projectiles: createProjectileStoreFromPlaceholder(
      createDynamicWorldStore(config.capacities.projectiles),
    ),
    pickups: createPickupStoreFromPlaceholder(createDynamicWorldStore(config.capacities.pickups)),
    progression: createProgressionStore(resolvePassiveUpgradeCount(content)),
  };
}

export function createWorldCommands(): WorldCommands {
  return {
    enemySpawn: new EnemySpawnBuffer(),
    projectileSpawn: new ProjectileSpawnBuffer(),
    pickupSpawn: new PickupSpawnBuffer(),
    damage: new DamageBuffer(),
    xpGrant: new XpGrantBuffer(),
    despawn: new DespawnBuffer(),
    stateChange: new StateChangeBuffer(),
  };
}

export function createWorldScratch(): WorldScratch {
  return {
    latestMoveMagnitude: 0,
  };
}

export function createWorld(
  config: Readonly<SimConfig>,
  content: SimContent,
  runState: RunState,
  seed: number,
): World {
  return {
    config,
    content,
    seed,
    rng: createWorldRng(seed),
    runState: { current: runState },
    time: {
      tick: 0,
      elapsedSeconds: 0,
    },
    stores: createWorldStores(config, content),
    commands: createWorldCommands(),
    scratch: createWorldScratch(),
    debug: createDebugCounters(),
  };
}
