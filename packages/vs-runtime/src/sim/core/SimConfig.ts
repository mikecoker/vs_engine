import { RunState } from "./RunState.ts";

export interface SimRectBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface SimBoundsConfig {
  readonly player: SimRectBounds;
  readonly spawn: SimRectBounds;
}

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
  readonly bounds?: SimBoundsConfig;
  readonly capacities: SimCapacityConfig;
}

export const DEFAULT_SIM_BOUNDS: Readonly<SimBoundsConfig> = {
  player: {
    minX: -900,
    maxX: 900,
    minY: -900,
    maxY: 900,
  },
  spawn: {
    minX: -1250,
    maxX: 1250,
    minY: -1250,
    maxY: 1250,
  },
};

export const DEFAULT_SIM_CONFIG: Readonly<SimConfig> = {
  fixedStepSeconds: 1 / 60,
  maxSubstepsPerFrame: 5,
  maxFrameSeconds: 0.25,
  initialRunState: RunState.MainMenu,
  bounds: DEFAULT_SIM_BOUNDS,
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
    bounds: {
      player: {
        minX: overrides.bounds?.player.minX ?? DEFAULT_SIM_BOUNDS.player.minX,
        maxX: overrides.bounds?.player.maxX ?? DEFAULT_SIM_BOUNDS.player.maxX,
        minY: overrides.bounds?.player.minY ?? DEFAULT_SIM_BOUNDS.player.minY,
        maxY: overrides.bounds?.player.maxY ?? DEFAULT_SIM_BOUNDS.player.maxY,
      },
      spawn: {
        minX: overrides.bounds?.spawn.minX ?? DEFAULT_SIM_BOUNDS.spawn.minX,
        maxX: overrides.bounds?.spawn.maxX ?? DEFAULT_SIM_BOUNDS.spawn.maxX,
        minY: overrides.bounds?.spawn.minY ?? DEFAULT_SIM_BOUNDS.spawn.minY,
        maxY: overrides.bounds?.spawn.maxY ?? DEFAULT_SIM_BOUNDS.spawn.maxY,
      },
    },
    capacities: {
      enemies: overrides.capacities?.enemies ?? DEFAULT_SIM_CONFIG.capacities.enemies,
      projectiles: overrides.capacities?.projectiles ?? DEFAULT_SIM_CONFIG.capacities.projectiles,
      pickups: overrides.capacities?.pickups ?? DEFAULT_SIM_CONFIG.capacities.pickups,
      commandBuffer:
        overrides.capacities?.commandBuffer ?? DEFAULT_SIM_CONFIG.capacities.commandBuffer,
    },
  };
}
