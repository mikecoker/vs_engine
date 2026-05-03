import test from "node:test";
import assert from "node:assert/strict";

import { createWorld } from "@vs-engine/runtime/src/sim/world/World";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import { ensureEnemyStore } from "@vs-engine/runtime/src/sim/enemies/EnemyStore";

test("enemy store allocates and releases reusable slots", () => {
  const world = createWorld(
    mergeSimConfig(),
    loadPrototypeContentRegistry(),
    RunState.Running,
    7,
  );
  const store = ensureEnemyStore(world);

  const first = store.allocate();
  const second = store.allocate();

  assert.equal(store.activeCount, 2);
  assert.equal(store.isAlive(first), true);
  assert.equal(store.isAlive(second), true);

  store.release(first);

  assert.equal(store.activeCount, 1);
  assert.equal(store.isAlive(first), false);

  const reused = store.allocate();

  assert.equal(reused, first);
  assert.equal(store.activeCount, 2);
});
