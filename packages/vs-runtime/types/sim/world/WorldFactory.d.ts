import type { SimContent } from "../core/SimApi.ts";
import type { SimConfig } from "../core/SimConfig.ts";
import type { RunState } from "../core/RunState.ts";
import { type World } from "./World.ts";
export declare function createWorldFactory(config: Readonly<SimConfig>, content: SimContent): (seed: number, runState: RunState) => World;
//# sourceMappingURL=WorldFactory.d.ts.map