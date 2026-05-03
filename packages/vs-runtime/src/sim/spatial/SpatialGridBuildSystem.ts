import type { FrameContext } from "../core/FrameContext.ts";
import { ensureSpatialGrid } from "./SpatialGrid.ts";

export function rebuildSpatialGrid(context: FrameContext): void {
  ensureSpatialGrid(context.world).rebuildEnemyOccupancy(context.world);
}
