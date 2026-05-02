import test from "node:test";
import assert from "node:assert/strict";

import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { RunState } from "../../../src/sim/core/RunState";
import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { createWorld } from "../../../src/sim/world/World";
import {
  DEFAULT_EDGE_SPAWN_MARGIN,
  DEFAULT_SPAWN_SAFE_RADIUS,
  ensureSpawnDirector,
  stepSpawnDirector,
} from "../../../src/sim/enemies/SpawnDirector";

test("spawn director emits the first wave batch on schedule", () => {
  const world = createWorld(
    mergeSimConfig(),
    loadPrototypeContentRegistry(),
    RunState.Running,
    19,
  );
  world.stores.player.exists = true;
  world.stores.player.posX = 100;
  world.stores.player.posY = 200;

  stepSpawnDirector(world, 0);

  assert.equal(world.commands.enemySpawn.count, 4);
});

test("spawn director respects the offscreen safe radius", () => {
  const world = createWorld(
    mergeSimConfig(),
    loadPrototypeContentRegistry(),
    RunState.Running,
    23,
  );
  world.stores.player.exists = true;
  world.stores.player.posX = 12;
  world.stores.player.posY = -8;

  const director = ensureSpawnDirector(world);
  stepSpawnDirector(world, 0);

  for (let index = 0; index < world.commands.enemySpawn.count; index += 1) {
    const command = world.commands.enemySpawn.get(index);
    const dx = command.x - world.stores.player.posX;
    const dy = command.y - world.stores.player.posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    assert.equal(distance >= director.safeRadius || distance >= DEFAULT_SPAWN_SAFE_RADIUS, true);
  }
});

test("spawn director keeps offscreen spawns near the playable edge corridor", () => {
  const world = createWorld(
    mergeSimConfig(),
    loadPrototypeContentRegistry(),
    RunState.Running,
    29,
  );
  world.stores.player.exists = true;
  world.stores.player.posX = 880;
  world.stores.player.posY = 0;

  stepSpawnDirector(world, 0);

  const playerBounds = world.config.bounds?.player;
  assert.ok(playerBounds);

  for (let index = 0; index < world.commands.enemySpawn.count; index += 1) {
    const command = world.commands.enemySpawn.get(index);
    assert.equal(command.x <= playerBounds.maxX + DEFAULT_EDGE_SPAWN_MARGIN, true);
    assert.equal(command.x >= playerBounds.minX - DEFAULT_EDGE_SPAWN_MARGIN, true);
    assert.equal(command.y <= playerBounds.maxY + DEFAULT_EDGE_SPAWN_MARGIN, true);
    assert.equal(command.y >= playerBounds.minY - DEFAULT_EDGE_SPAWN_MARGIN, true);
  }
});
