import assert from "node:assert/strict";
import test from "node:test";

import { adaptCocosInput, normalizeMovementAxes } from "../../../src/client/input/CocosInputAdapter";

test("normalizeMovementAxes clamps diagonal input to unit length", () => {
  const movement = normalizeMovementAxes(1, 1);
  assert.ok(Math.abs(Math.hypot(movement.moveX, movement.moveY) - 1) < 1e-6);
});

test("adaptCocosInput fills missing buttons with false", () => {
  const input = adaptCocosInput({ moveX: 0.5, moveY: -0.25 });
  assert.equal(input.pausePressed, false);
  assert.equal(input.confirmPressed, false);
  assert.equal(input.cancelPressed, false);
  assert.equal(input.moveX, 0.5);
  assert.equal(input.moveY, -0.25);
});
