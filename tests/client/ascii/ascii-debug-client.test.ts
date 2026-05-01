import assert from "node:assert/strict";
import test from "node:test";

import { AsciiDebugClient } from "../../../src/client/ascii/AsciiDebugClient";
import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { createSim } from "../../../src/sim/core/Sim";

test("AsciiDebugClient formats a textual frame after stepping", () => {
  const content = loadPrototypeContentRegistry();
  const sim = createSim({}, content, 5);
  const client = new AsciiDebugClient(sim, content, {
    width: 20,
    height: 10,
    worldUnitsPerCell: 16,
  });

  client.resetRun(5);
  const output = client.stepToString(1 / 60, {
    moveX: 1,
    moveY: 0,
  });

  assert.match(output, /HP /);
  assert.match(output, /STATE /);
  assert.match(output, /@/);
});
