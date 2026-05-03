import type { World } from "../world/World.ts";
export interface SpatialGrid {
    readonly cellSize: number;
    readonly buckets: Map<number, number[]>;
    readonly activeKeys: number[];
    readonly scratchResults: number[];
    reset(): void;
    rebuildEnemyOccupancy(world: World): void;
}
declare module "../world/World" {
    interface WorldScratch {
        spatialGrid?: SpatialGrid;
    }
}
export declare function cellCoord(value: number, cellSize: number): number;
export declare function createCellKey(cellX: number, cellY: number): number;
export declare function createSpatialGrid(cellSize?: number): SpatialGrid;
export declare function ensureSpatialGrid(world: World): SpatialGrid;
//# sourceMappingURL=SpatialGrid.d.ts.map