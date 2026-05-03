import type { SimContent } from "../core/SimApi.ts";
import type { SimConfig } from "../core/SimConfig.ts";
import { DamageBuffer, DespawnBuffer, EnemySpawnBuffer, PickupSpawnBuffer, ProjectileSpawnBuffer, StateChangeBuffer, XpGrantBuffer } from "../core/commands/index.ts";
import { type DebugCounters } from "../debug/DebugSnapshot.ts";
import type { RunState } from "../core/RunState.ts";
import { type PlayerStore } from "../player/PlayerStore.ts";
import { type EnemyStore } from "../enemies/EnemyStore.ts";
import { type ProjectileStore } from "../projectiles/ProjectileStore.ts";
import { type PickupStore } from "../pickups/PickupStore.ts";
import { type ProgressionStore } from "../progression/ProgressionStore.ts";
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
    nextHealthPickupSpawnAtSeconds: number;
    nextMagnetPickupSpawnAtSeconds: number;
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
export declare function createWorldRng(seed: number): WorldRng;
export declare function createDynamicWorldStore(capacity: number): DynamicWorldStore;
export declare function createWorldStores(config: Readonly<SimConfig>, content: SimContent): WorldStores;
export declare function createWorldCommands(): WorldCommands;
export declare function createWorldScratch(): WorldScratch;
export declare function createWorld(config: Readonly<SimConfig>, content: SimContent, runState: RunState, seed: number): World;
//# sourceMappingURL=World.d.ts.map