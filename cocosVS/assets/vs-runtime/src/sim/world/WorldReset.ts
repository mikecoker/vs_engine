import type { World } from "./World.ts";
import type { RunState } from "../core/RunState.ts";
import { initializePlayerForRun, resetPlayerStore } from "../player/PlayerReset.ts";
import { RunState as RunStates } from "../core/RunState.ts";

export function resetWorld(world: World, seed: number, runState: RunState): void {
  world.seed = seed;
  world.rng.reset(seed);
  world.runState.current = runState;
  world.time.tick = 0;
  world.time.elapsedSeconds = 0;

  resetPlayerStore(world.stores.player);
  if (runState === RunStates.StartingRun || runState === RunStates.Running) {
    initializePlayerForRun(world.stores.player, world.content);
  }
  world.stores.player.debugInvulnerable = false;

  world.stores.enemies.reset();
  world.stores.projectiles.reset();
  world.stores.pickups.reset();

  world.stores.progression.level = 1;
  world.stores.progression.xp = 0;
  world.stores.progression.xpToNext = 5;
  world.stores.progression.queuedLevelUps = 0;
  world.stores.progression.currentChoices.length = 0;
  world.stores.progression.passiveUpgradeLevels.fill(0);
  world.stores.progression.activeCurveIndex = -1;
  world.stores.progression.initialized = false;
  world.stores.progression.lastResetTick = -1;

  world.commands.enemySpawn.clear();
  world.commands.projectileSpawn.clear();
  world.commands.pickupSpawn.clear();
  world.commands.damage.clear();
  world.commands.xpGrant.clear();
  world.commands.despawn.clear();
  world.commands.stateChange.clear();

  world.scratch.latestMoveMagnitude = 0;
  world.scratch.nextHealthPickupSpawnAtSeconds = 12;
  world.scratch.nextMagnetPickupSpawnAtSeconds = 18;

  world.debug.tick = 0;
  world.debug.gameplayTicks = 0;
  world.debug.droppedFrameSubsteps = 0;
  world.debug.lastFrameSubsteps = 0;
  world.debug.estimatedStepSeconds = 0;
  world.debug.lastRunStateChangeReason = "reset";

  for (const counter of Object.values(world.debug.systemCounters)) {
    counter.executedTicks = 0;
    counter.skippedTicks = 0;
  }
}
