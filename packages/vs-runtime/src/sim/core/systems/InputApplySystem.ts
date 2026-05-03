import { extractDebugCommandFrame } from "../../debug/DebugCommands.ts";
import { getEnemyRuntimeContent } from "../../enemies/EnemyArchetypeRuntime.ts";
import { sampleOffscreenSpawnPoint, ensureSpawnDirector } from "../../enemies/SpawnDirector.ts";
import { RunState } from "../RunState.ts";
import { applyRunState } from "../RunStateTransition.ts";
import type { FrameContext } from "../FrameContext.ts";

const DEBUG_SPAWN_BATCH_COUNT = 10;

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
    const director = ensureSpawnDirector(world);
    const runtimeContent = getEnemyRuntimeContent(world.content);
    const archetypeCount = runtimeContent?.archetypes.length ?? 0;
    for (let count = 0; count < DEBUG_SPAWN_BATCH_COUNT; count += 1) {
      const spawn = sampleOffscreenSpawnPoint(world, director.safeRadius, director.ringThickness);
      const archetypeIndex = archetypeCount > 0
        ? Math.floor(world.rng.next() * archetypeCount) % archetypeCount
        : 0;
      world.commands.enemySpawn.enqueue(archetypeIndex, spawn.x, spawn.y);
    }
  }

  if (frameInput.debugToggleInvulnerablePressed) {
    world.stores.player.debugInvulnerable = !world.stores.player.debugInvulnerable;
    if (world.stores.player.debugInvulnerable) {
      world.stores.player.invulnRemaining = 0;
    }
  }
}
