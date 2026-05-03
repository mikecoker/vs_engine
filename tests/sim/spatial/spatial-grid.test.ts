import test from "node:test";
import assert from "node:assert/strict";

import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";
import { ensureEnemyStore } from "@vs-engine/runtime/src/sim/enemies/EnemyStore";
import { cellCoord, createCellKey, ensureSpatialGrid } from "@vs-engine/runtime/src/sim/spatial/SpatialGrid";

test("spatial grid query returns nearby enemy slots", () => {
  const world = createWorld(
    mergeSimConfig(),
    loadPrototypeContentRegistry(),
    RunState.Running,
    41,
  );
  const store = ensureEnemyStore(world);
  const first = store.allocate();
  const second = store.allocate();
  const third = store.allocate();

  store.posX[first] = 16;
  store.posY[first] = 20;
  store.posX[second] = 48;
  store.posY[second] = 12;
  store.posX[third] = 400;
  store.posY[third] = 400;

  const grid = ensureSpatialGrid(world);
  grid.rebuildEnemyOccupancy(world);

  const results = new Set<number>();
  const queryX = 32;
  const queryY = 16;
  const radius = 40;
  const minCellX = cellCoord(queryX - radius, grid.cellSize);
  const maxCellX = cellCoord(queryX + radius, grid.cellSize);
  const minCellY = cellCoord(queryY - radius, grid.cellSize);
  const maxCellY = cellCoord(queryY + radius, grid.cellSize);

  for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      const bucket = grid.buckets.get(createCellKey(cellX, cellY));
      if (!bucket) {
        continue;
      }

      for (let index = 0; index < bucket.length; index += 1) {
        results.add(bucket[index]);
      }
    }
  }

  assert.deepEqual(
    [...results].sort((left, right) => left - right),
    [first, second].sort((left, right) => left - right),
  );
});
