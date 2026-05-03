import { canTransitionRunState, type RunState } from "./RunState.ts";
import type { World } from "../world/World.ts";

export function applyRunState(world: World, nextState: RunState, reason: string): void {
  if (!canTransitionRunState(world.runState.current, nextState)) {
    return;
  }

  world.runState.current = nextState;
  world.debug.lastRunStateChangeReason = reason;
}
