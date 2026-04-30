import test from "node:test";
import assert from "node:assert/strict";

import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { RunState } from "../../../src/sim/core/RunState";
import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { createWorld } from "../../../src/sim/world/World";
import { ensureEnemyStore } from "../../../src/sim/enemies/EnemyStore";
import { ensureSpatialGrid } from "../../../src/sim/spatial/SpatialGrid";

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

  const results: number[] = [];
  grid.queryNearbySlots(32, 16, 40, (slot) => {
    results.push(slot);
  });

  assert.deepEqual(
    results.sort((left, right) => left - right),
    [first, second].sort((left, right) => left - right),
  );
});
