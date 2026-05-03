import type { World } from "../world/World.ts";
export declare const DEFAULT_SPAWN_SAFE_RADIUS = 340;
export declare const DEFAULT_SPAWN_RING_THICKNESS = 180;
export declare const DEFAULT_MAX_ACTIVE_ENEMIES = 500;
export declare const DEFAULT_EDGE_SPAWN_MARGIN = 220;
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
export declare function ensureSpawnDirector(world: World): SpawnDirectorState;
export declare function countActiveEnemiesByArchetype(world: World, requiredSize: number): Uint16Array;
export declare function sampleOffscreenSpawnPoint(world: World, safeRadius: number, ringThickness: number): {
    x: number;
    y: number;
};
export declare function stepSpawnDirector(world: World, elapsedSeconds: number): void;
//# sourceMappingURL=SpawnDirector.d.ts.map