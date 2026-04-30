import test from "node:test";
import assert from "node:assert/strict";

import { createSim } from "../../../src/sim/core/Sim";
import { RunState } from "../../../src/sim/core/RunState";

test("fixed-step stepping advances deterministically from variable frame input", () => {
  const sim = createSim();
  sim.resetRun(123);

  const stepOne = sim.step(1 / 120);
  const stepTwo = sim.step(1 / 120);

  assert.equal(stepOne, 0);
  assert.equal(stepTwo, 1);

  const debug = sim.getDebugSnapshot();
  assert.equal(debug.tick, 1);
  assert.equal(debug.gameplayTicks, 1);
  assert.equal(debug.runState, RunState.Running);
});
