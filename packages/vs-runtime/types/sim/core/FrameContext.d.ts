import type { SimConfig } from "./SimConfig.ts";
import type { SimInput } from "./SimInput.ts";
import type { World } from "../world/World.ts";
export interface FrameContext {
    readonly dt: number;
    readonly tick: number;
    readonly elapsedSeconds: number;
    readonly frameInput: Readonly<SimInput>;
    readonly config: Readonly<SimConfig>;
    readonly world: World;
}
//# sourceMappingURL=FrameContext.d.ts.map