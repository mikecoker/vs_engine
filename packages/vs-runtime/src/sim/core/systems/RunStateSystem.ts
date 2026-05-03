import type { FrameContext } from "../FrameContext.ts";
import { RunState } from "../RunState.ts";
import { applyRunState } from "../RunStateTransition.ts";
import { initializePlayerForRun } from "../../player/PlayerReset.ts";

export function runStateSystem(context: FrameContext): void {
  const { world } = context;

  const pendingCount = world.commands.stateChange.count;
  for (let index = 0; index < pendingCount; index += 1) {
    const command = world.commands.stateChange.get(index);
    applyRunState(world, command.nextState, command.reason);
  }
  world.commands.stateChange.clear();

  if (world.runState.current === RunState.StartingRun) {
    if (!world.stores.player.exists) {
      initializePlayerForRun(world.stores.player, world.content);
    }
    applyRunState(world, RunState.Running, "startup-complete");
  }
}
