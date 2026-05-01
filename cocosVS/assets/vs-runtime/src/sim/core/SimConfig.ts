import { RunState } from "./RunState.ts";

export interface SimCapacityConfig {
  readonly enemies: number;
  readonly projectiles: number;
  readonly pickups: number;
  readonly commandBuffer: number;
}

export interface SimConfig {
  readonly fixedStepSeconds: number;
  readonly maxSubstepsPerFrame: number;
  readonly maxFrameSeconds: number;
  readonly initialRunState: RunState;
  readonly capacities: SimCapacityConfig;
}

export const DEFAULT_SIM_CONFIG: Readonly<SimConfig> = {
  fixedStepSeconds: 1 / 60,
  maxSubstepsPerFrame: 5,
  maxFrameSeconds: 0.25,
  initialRunState: RunState.MainMenu,
  capacities: {
    enemies: 512,
    projectiles: 1024,
    pickups: 512,
    commandBuffer: 256,
  },
};

export function mergeSimConfig(overrides: Partial<SimConfig> = {}): SimConfig {
  return {
    fixedStepSeconds: overrides.fixedStepSeconds ?? DEFAULT_SIM_CONFIG.fixedStepSeconds,
    maxSubstepsPerFrame: overrides.maxSubstepsPerFrame ?? DEFAULT_SIM_CONFIG.maxSubstepsPerFrame,
    maxFrameSeconds: overrides.maxFrameSeconds ?? DEFAULT_SIM_CONFIG.maxFrameSeconds,
    initialRunState: overrides.initialRunState ?? DEFAULT_SIM_CONFIG.initialRunState,
    capacities: {
      enemies: overrides.capacities?.enemies ?? DEFAULT_SIM_CONFIG.capacities.enemies,
      projectiles: overrides.capacities?.projectiles ?? DEFAULT_SIM_CONFIG.capacities.projectiles,
      pickups: overrides.capacities?.pickups ?? DEFAULT_SIM_CONFIG.capacities.pickups,
      commandBuffer:
        overrides.capacities?.commandBuffer ?? DEFAULT_SIM_CONFIG.capacities.commandBuffer,
    },
  };
}
