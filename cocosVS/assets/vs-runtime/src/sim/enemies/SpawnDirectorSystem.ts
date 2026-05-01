import type { FrameContext } from "../core/FrameContext.ts";
import { stepSpawnDirector } from "./SpawnDirector.ts";

export function stepSpawnDirectorSystem(context: FrameContext): void {
  stepSpawnDirector(context.world, context.elapsedSeconds);
}
