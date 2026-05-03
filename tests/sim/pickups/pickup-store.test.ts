import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import { extractRenderSnapshot } from "@vs-engine/runtime/src/sim/core/RenderExtract";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { ensurePickupStore } from "@vs-engine/runtime/src/sim/pickups/PickupStore";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

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

test("pickup store keeps active-slot indexes valid through release, growth, and reset", () => {
  const world = createWorld(
    mergeSimConfig({ capacities: { enemies: 1, projectiles: 1, pickups: 2, commandBuffer: 8 } }),
    loadPrototypeContentRegistry(),
    RunState.Running,
    53,
  );
  const store = ensurePickupStore(world);

  const first = store.allocate();
  const second = store.allocate();
  const secondGeneration = store.generation[second];
  const third = store.allocate();

  assert.equal(store.capacity, 4);
  store.release(second);
  assert.equal(store.validate(second, secondGeneration), false);
  assert.equal(store.generation[second], secondGeneration + 1);

  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    assert.equal(store.isAlive(slot), true);
    assert.equal(store.activeSlotIndex[slot], denseIndex);
  }
  assert.deepEqual(
    new Set([store.activeSlots[0], store.activeSlots[1]]),
    new Set([first, third]),
  );

  store.reset();
  assert.equal(store.activeCount, 0);
  assert.equal(store.isAlive(first), false);
  assert.equal(store.activeSlotIndex[first], -1);
});
