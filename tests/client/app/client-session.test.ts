import assert from "node:assert/strict";
import test from "node:test";

import { ClientSession } from "../../../src/client/app/ClientSession";
import { createSim } from "../../../src/sim/core/Sim";
import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";

test("ClientSession composes render, hud, camera, and debug state", () => {
  const content = loadPrototypeContentRegistry();
  const sim = createSim({}, content, 19);
  const session = new ClientSession(sim, content);

  sim.resetRun(19);
  const frame = session.step(1 / 60, {
    moveX: 1,
    moveY: 0,
  });

  assert.equal(frame.render.player.visible, true);
  assert.equal(frame.hud.level >= 1, true);
  assert.equal(frame.camera.centerX, frame.render.player.x);
  assert.equal(frame.debug.tick >= 1, true);
});
