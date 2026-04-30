import test from 'node:test';
import assert from 'node:assert/strict';
import { createMoveInput, createNeutralInput } from '../helpers/fakeInput';
import { getFixedStepSeconds, stepSimTicks } from '../helpers/stepSim';

test('stepSimTicks advances the sim with the fixed step duration', () => {
  const steps: Array<{ dt: number; inputMoveX: number }> = [];
  const sim = {
    fixedStepSeconds: 1 / 60,
    step(dt: number, input: { moveX: number }) {
      steps.push({ dt, inputMoveX: input.moveX });
    },
  };

  stepSimTicks(sim, 3, createMoveInput(1, 0));

  assert.equal(steps.length, 3);
  assert.deepEqual(
    steps.map((step) => step.dt),
    [1 / 60, 1 / 60, 1 / 60],
  );
  assert.deepEqual(
    steps.map((step) => step.inputMoveX),
    [1, 1, 1],
  );
});

test('stepSimTicks accepts a per-tick input factory', () => {
  const moveXs: number[] = [];
  const sim = {
    getFixedStepSeconds: () => 1 / 120,
    step(_dt: number, input: { moveX: number }) {
      moveXs.push(input.moveX);
    },
  };

  stepSimTicks(sim, 4, (tick) => createMoveInput(tick, 0));

  assert.deepEqual(moveXs, [0, 1, 2, 3]);
  assert.equal(getFixedStepSeconds(sim), 1 / 120);
});

test('neutral fake input has safe default values', () => {
  assert.deepEqual(createNeutralInput(), {
    moveX: 0,
    moveY: 0,
    pausePressed: false,
    confirmPressed: false,
    cancelPressed: false,
  });
});
