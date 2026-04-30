import type { FrameContext } from "../core/FrameContext";
import { stepSpawnDirector } from "./SpawnDirector";

export function stepSpawnDirectorSystem(context: FrameContext): void {
  stepSpawnDirector(context.world, context.elapsedSeconds);
}
