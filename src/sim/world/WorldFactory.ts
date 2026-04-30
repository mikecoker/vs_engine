import type { SimContent } from "../core/SimApi";
import type { SimConfig } from "../core/SimConfig";
import { createWorld, type World } from "./World";

export function createWorldFactory(
  config: Readonly<SimConfig>,
  content: SimContent,
): (seed: number, runState: World["runState"]["current"]) => World {
  return (seed, runState) => createWorld(config, content, runState, seed);
}
