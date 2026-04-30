import test from "node:test";
import assert from "node:assert/strict";

import { createSim } from "../../../src/sim/core/Sim";
import { RunState } from "../../../src/sim/core/RunState";

test("sim constructs with stable default snapshots", () => {
  const sim = createSim();

  const render = sim.getRenderSnapshot();
  const debug = sim.getDebugSnapshot();

  assert.equal(render.runState, RunState.MainMenu);
  assert.equal(render.enemies.activeCount, 0);
  assert.equal(render.projectiles.activeCount, 0);
  assert.equal(render.pickups.activeCount, 0);
  assert.equal(debug.tick, 0);
  assert.equal(debug.gameplayTicks, 0);
});
