import type { SimInput } from '../../../src/sim/core/SimInput';

export function createNeutralInput(): SimInput {
  return {
    moveX: 0,
    moveY: 0,
    pausePressed: false,
    confirmPressed: false,
    cancelPressed: false,
  };
}

export function createMoveInput(moveX: number, moveY: number): SimInput {
  return {
    ...createNeutralInput(),
    moveX,
    moveY,
  };
}

export function createPressedInput(
  overrides: Partial<SimInput> = {},
): SimInput {
  return {
    ...createNeutralInput(),
    ...overrides,
  };
}
