import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { extractRenderSnapshot } from "../../../src/sim/core/RenderExtract";
import { RunState } from "../../../src/sim/core/RunState";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { ensurePickupStore } from "../../../src/sim/pickups/PickupStore";
import { createWorld } from "../../../src/sim/world/World";

test("pickup store keeps live slots stable after release", () => {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 43);
  const store = ensurePickupStore(world);

  const first = store.allocate();
  const second = store.allocate();
  const secondGeneration = store.generation[second];
  store.posX[second] = 12;
  store.posY[second] = 24;
  store.value[second] = 3;

  store.release(first);

  assert.equal(store.activeCount, 1);
  assert.equal(store.isAlive(first), false);
  assert.equal(store.validate(second, secondGeneration), true);
  assert.equal(store.value[second], 3);

  const render = extractRenderSnapshot(world);
  assert.equal(render.pickups.activeCount, 1);
  assert.equal(render.pickups.posX[0], 12);
  assert.equal(render.pickups.posY[0], 24);
});

