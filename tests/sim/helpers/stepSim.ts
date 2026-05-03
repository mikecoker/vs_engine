import type { TestableSimLike } from '@vs-engine/runtime/src/sim/core/SimApi';
import type { SimInput } from '@vs-engine/runtime/src/sim/core/SimInput';
import { createNeutralInput } from './fakeInput';

export type StepInputFactory = SimInput | ((tick: number) => SimInput);

export function stepSimTicks(
  sim: TestableSimLike,
  ticks: number,
  input: StepInputFactory = createNeutralInput(),
): void {
  const fixedStepSeconds = getFixedStepSeconds(sim);

  for (let tick = 0; tick < ticks; tick += 1) {
    const inputFrame = typeof input === 'function' ? input(tick) : input;
    sim.step(fixedStepSeconds, inputFrame);
  }
}

export function getFixedStepSeconds(sim: TestableSimLike): number {
  if (typeof sim.getFixedStepSeconds === 'function') {
    return sim.getFixedStepSeconds();
  }

  if (typeof sim.fixedStepSeconds === 'number') {
    return sim.fixedStepSeconds;
  }

  throw new Error('Sim does not expose fixedStepSeconds or getFixedStepSeconds().');
}
