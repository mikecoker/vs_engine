import type { FrameContext } from "../core/FrameContext";
import { ensureSpatialGrid } from "./SpatialGrid";

export function rebuildSpatialGrid(context: FrameContext): void {
  ensureSpatialGrid(context.world).rebuildEnemyOccupancy(context.world);
}
