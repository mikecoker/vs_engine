import { extractDebugCommandFrame } from "../../debug/DebugCommands.ts";
import { RunState } from "../RunState.ts";
import { applyRunState } from "../RunStateTransition.ts";
import type { FrameContext } from "../FrameContext.ts";

export function inputApplySystem(context: FrameContext): void {
  const { frameInput, world } = context;

  world.scratch.latestMoveMagnitude = Math.hypot(frameInput.moveX, frameInput.moveY);

  if (frameInput.pausePressed) {
    if (world.runState.current === RunState.Running) {
      applyRunState(world, RunState.Paused, "pause-pressed");
    } else if (world.runState.current === RunState.Paused) {
      applyRunState(world, RunState.Running, "pause-resume");
    }
  }

  const debugCommandFrame = extractDebugCommandFrame(frameInput);
  if (debugCommandFrame.grantXp) {
    world.commands.xpGrant.enqueue(1);
  }

  if (debugCommandFrame.spawnWave) {
    world.commands.enemySpawn.enqueue(0, 0, 0);
  }
}
