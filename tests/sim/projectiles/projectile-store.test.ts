import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { extractRenderSnapshot } from "../../../src/sim/core/RenderExtract";
import { RunState } from "../../../src/sim/core/RunState";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { ensureProjectileStore } from "../../../src/sim/projectiles/ProjectileStore";
import { createWorld } from "../../../src/sim/world/World";

test("projectile store keeps live slots stable after release", () => {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 41);
  const store = ensureProjectileStore(world);

  const first = store.allocate();
  const second = store.allocate();
  const secondGeneration = store.generation[second];
  store.posX[second] = 20;
  store.posY[second] = 40;

  store.release(first);

  assert.equal(store.activeCount, 1);
  assert.equal(store.isAlive(first), false);
  assert.equal(store.validate(second, secondGeneration), true);
  assert.equal(store.posX[second], 20);

  const render = extractRenderSnapshot(world);
  assert.equal(render.projectiles.activeCount, 1);
  assert.equal(render.projectiles.posX[0], 20);
  assert.equal(render.projectiles.posY[0], 40);
});

