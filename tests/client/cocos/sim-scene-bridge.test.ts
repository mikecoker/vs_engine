import assert from "node:assert/strict";
import test from "node:test";

import { SimSceneBridge } from "@vs-engine/runtime/src/client/cocos/SimSceneBridge";
import { createSim } from "@vs-engine/runtime/src/sim/core/Sim";
import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";

test("SimSceneBridge steps the sim and returns composed frame models", () => {
  const content = loadPrototypeContentRegistry();
  const sim = createSim({}, content, 17);
  const bridge = new SimSceneBridge(sim, content);

  bridge.resetRun(17);
  const frame = bridge.step(1 / 60, {
    moveX: 1,
    moveY: 0,
  });

  assert.equal(frame.hud.level >= 1, true);
  assert.equal(frame.runState.runState, sim.getRenderSnapshot().runState);
  assert.equal(frame.render.player.visible, true);
  assert.equal(frame.render.enemies.length >= 0, true);
});
