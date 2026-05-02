import { DebugCommandQueue, type DebugCommand } from './DebugCommands.ts';
import { DebugCounters } from './DebugCounters.ts';
import { createDebugSnapshot, type DebugSnapshot } from './DebugSnapshot.ts';
import type { RunState } from '../core/RunState.ts';

export interface DebugWorldHooks {
  readonly counters: DebugCounters;
  readonly debugCommands: DebugCommandQueue;
  getActiveEnemyCount(): number;
  getActiveProjectileCount(): number;
  getActivePickupCount(): number;
  getPlayerInvulnerable(): boolean;
  getRunState(): RunState;
  getTick(): number;
  getSeed(): number;
  grantXp(amount: number): void;
  spawnTestWave(count: number, archetypeId?: number): void;
  killAllEnemies(): void;
}

export function processDebugCommands(world: DebugWorldHooks): void {
  const commands = world.debugCommands.drain();

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    processDebugCommand(world, command);
  }
}

export function processDebugCommand(world: DebugWorldHooks, command: DebugCommand): void {
  switch (command.type) {
    case 'grant_xp':
      world.grantXp(command.amount);
      break;
    case 'spawn_test_wave':
      world.spawnTestWave(command.count, command.archetypeId);
      world.counters.recordSpawnCommands(command.count);
      break;
    case 'kill_all_enemies':
      world.killAllEnemies();
      break;
    default: {
      const exhaustiveCheck: never = command;
      throw new Error(`Unhandled debug command: ${String(exhaustiveCheck)}`);
    }
  }
}

export function syncDebugCounters(world: DebugWorldHooks): void {
  world.counters.setActiveCounts(
    world.getActiveEnemyCount(),
    world.getActiveProjectileCount(),
    world.getActivePickupCount(),
  );
}

export function collectDebugSnapshot(world: DebugWorldHooks): DebugSnapshot {
  syncDebugCounters(world);

  return createDebugSnapshot({
    runState: world.getRunState(),
    tick: world.getTick(),
    seed: world.getSeed(),
    playerInvulnerable: world.getPlayerInvulnerable(),
    counters: world.counters,
  });
}
