import type { World } from "../world/World.ts";
import { ensureEnemyStore } from "../enemies/EnemyStore.ts";

export interface SpatialGrid {
  readonly cellSize: number;
  readonly buckets: Map<number, number[]>;
  readonly activeKeys: number[];
  readonly scratchResults: number[];
  reset(): void;
  rebuildEnemyOccupancy(world: World): void;
  queryNearbySlots(x: number, y: number, radius: number, visit: (slot: number) => void): void;
}

declare module "../world/World" {
  interface WorldScratch {
    spatialGrid?: SpatialGrid;
  }
}

const DEFAULT_GRID_CELL_SIZE = 64;

export function cellCoord(value: number, cellSize: number): number {
  return Math.floor(value / cellSize);
}

export function createCellKey(cellX: number, cellY: number): number {
  return cellX * 73856093 ^ cellY * 19349663;
}

export function createSpatialGrid(cellSize = DEFAULT_GRID_CELL_SIZE): SpatialGrid {
  return {
    cellSize,
    buckets: new Map<number, number[]>(),
    activeKeys: [],
    scratchResults: [],
    reset() {
      for (let index = 0; index < this.activeKeys.length; index += 1) {
        const key = this.activeKeys[index];
        const bucket = this.buckets.get(key);
        if (bucket) {
          bucket.length = 0;
        }
      }
      this.activeKeys.length = 0;
      this.scratchResults.length = 0;
    },
    rebuildEnemyOccupancy(world: World) {
      this.reset();
      const store = ensureEnemyStore(world);
      for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
        const slot = store.activeSlots[denseIndex];
        const key = createCellKey(
          cellCoord(store.posX[slot], this.cellSize),
          cellCoord(store.posY[slot], this.cellSize),
        );

        let bucket = this.buckets.get(key);
        if (!bucket) {
          bucket = [];
          this.buckets.set(key, bucket);
        }
        if (bucket.length === 0) {
          this.activeKeys.push(key);
        }
        bucket.push(slot);
      }
    },
    queryNearbySlots(x: number, y: number, radius: number, visit: (slot: number) => void) {
      const minCellX = cellCoord(x - radius, this.cellSize);
      const maxCellX = cellCoord(x + radius, this.cellSize);
      const minCellY = cellCoord(y - radius, this.cellSize);
      const maxCellY = cellCoord(y + radius, this.cellSize);

      for (let cellYIndex = minCellY; cellYIndex <= maxCellY; cellYIndex += 1) {
        for (let cellXIndex = minCellX; cellXIndex <= maxCellX; cellXIndex += 1) {
          const bucket = this.buckets.get(createCellKey(cellXIndex, cellYIndex));
          if (!bucket) {
            continue;
          }

          for (let index = 0; index < bucket.length; index += 1) {
            visit(bucket[index]);
          }
        }
      }
    },
  };
}

export function ensureSpatialGrid(world: World): SpatialGrid {
  if (!world.scratch.spatialGrid) {
    world.scratch.spatialGrid = createSpatialGrid();
  }

  return world.scratch.spatialGrid;
}
