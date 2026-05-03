import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import type { SimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import {
  createPlayerStore,
  initializePlayerForRun,
  stepPlayerMovement,
} from "@vs-engine/runtime/src/sim/player/PlayerApi";
import { createMoveInput, createNeutralInput } from "../helpers/fakeInput";

function createMovementContext(
  player: ReturnType<typeof createPlayerStore>,
  moveX: number,
  moveY: number,
  configOverrides: Partial<SimConfig> = {},
): FrameContext {
  return {
    dt: 1 / 60,
    tick: 1,
    elapsedSeconds: 1 / 60,
    frameInput: moveX === 0 && moveY === 0 ? createNeutralInput() : createMoveInput(moveX, moveY),
    config: {
      fixedStepSeconds: 1 / 60,
      maxSubstepsPerFrame: 5,
      maxFrameSeconds: 0.25,
      initialRunState: RunState.Running,
      bounds: configOverrides.bounds,
      capacities: {
        enemies: 1,
        projectiles: 1,
        pickups: 1,
        commandBuffer: 1,
      },
    },
    world: {
      stores: {
        player,
      },
    },
  } as FrameContext;
}

test("player movement applies move speed to normalized input", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();
  initializePlayerForRun(player, content);

  stepPlayerMovement(createMovementContext(player, 1, 0));

  assert.equal(player.posX, 160 / 60);
  assert.equal(player.posY, 0);
  assert.equal(player.velX, 160);
  assert.equal(player.velY, 0);
});

test("diagonal movement is normalized to the same speed as axis-aligned movement", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();
  initializePlayerForRun(player, content);

  stepPlayerMovement(createMovementContext(player, 1, 1));

  const traveledDistance = Math.hypot(player.posX, player.posY);
  assert.ok(Math.abs(traveledDistance - 160 / 60) < 1e-9);
  assert.ok(Math.abs(Math.hypot(player.velX, player.velY) - 160) < 1e-9);
});

test("player movement clamps to configured world bounds", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();
  initializePlayerForRun(player, content);
  player.posX = 899;
  player.posY = -899;

  const context = createMovementContext(player, 1, -1, {
    bounds: {
      player: { minX: -900, maxX: 900, minY: -900, maxY: 900 },
      spawn: { minX: -1200, maxX: 1200, minY: -1200, maxY: 1200 },
    },
  });

  stepPlayerMovement(context);

  assert.equal(player.posX, 900);
  assert.equal(player.posY, -900);
});
