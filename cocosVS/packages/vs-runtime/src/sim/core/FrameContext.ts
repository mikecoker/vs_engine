import type { SimConfig } from "./SimConfig";
import type { SimInput } from "./SimInput";
import type { World } from "../world/World";

export interface FrameContext {
  readonly dt: number;
  readonly tick: number;
  readonly elapsedSeconds: number;
  readonly frameInput: Readonly<SimInput>;
  readonly config: Readonly<SimConfig>;
  readonly world: World;
}
