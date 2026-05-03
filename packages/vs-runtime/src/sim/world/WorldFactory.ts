import type { SimContent } from "../core/SimApi.ts";
import type { SimConfig } from "../core/SimConfig.ts";
import type { RunState } from "../core/RunState.ts";
import { createWorld, type World } from "./World.ts";

export function createWorldFactory(
  config: Readonly<SimConfig>,
  content: SimContent,
): (seed: number, runState: RunState) => World {
  return (seed, runState) => createWorld(config, content, runState, seed);
}
