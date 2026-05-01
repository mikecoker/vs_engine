import type { RunState } from "../core/RunState.ts";
import type { DebugCounterValues } from "./DebugCounters.ts";

export const SYSTEM_ORDER = [
  "RunStateSystem",
  "InputApplySystem",
  "SpawnDirectorSystem",
  "ApplySpawnCommandsSystem",
  "PlayerMovementSystem",
  "EnemyMovementSystem",
  "WeaponFireSystem",
  "ProjectileMovementSystem",
  "SpatialGridBuildSystem",
  "ContactDamageQuerySystem",
  "ProjectileHitQuerySystem",
  "DamageResolveSystem",
  "DeathAndDropSystem",
  "PickupMagnetSystem",
  "PickupCollectSystem",
  "ProgressionSystem",
  "CleanupSystem",
  "RenderExtractSystem",
] as const;

export type SystemName = (typeof SYSTEM_ORDER)[number];

export interface SystemDebugCounter {
  executedTicks: number;
  skippedTicks: number;
}

export interface DebugCounters {
  tick: number;
  gameplayTicks: number;
  droppedFrameSubsteps: number;
  lastFrameSubsteps: number;
  estimatedStepSeconds: number;
  lastRunStateChangeReason: string;
  systemCounters: Record<SystemName, SystemDebugCounter>;
}

export interface DebugSnapshot {
  readonly tick: number;
  readonly seed: number;
  readonly gameplayTicks: number;
  readonly droppedFrameSubsteps: number;
  readonly lastFrameSubsteps: number;
  readonly estimatedStepSeconds: number;
  readonly runState: RunState;
  readonly lastRunStateChangeReason: string;
  readonly counters: DebugCounterValues;
  readonly activeEnemyCount: number;
  readonly activeProjectileCount: number;
  readonly activePickupCount: number;
  readonly queueSizes: {
    readonly enemySpawn: number;
    readonly projectileSpawn: number;
    readonly pickupSpawn: number;
    readonly damage: number;
    readonly xpGrant: number;
    readonly despawn: number;
    readonly stateChange: number;
  };
  readonly systems: Record<SystemName, SystemDebugCounter>;
}

export function createDebugCounters(): DebugCounters {
  return {
    tick: 0,
    gameplayTicks: 0,
    droppedFrameSubsteps: 0,
    lastFrameSubsteps: 0,
    estimatedStepSeconds: 0,
    lastRunStateChangeReason: "initial",
    systemCounters: SYSTEM_ORDER.reduce(
      (accumulator, systemName) => {
        accumulator[systemName] = { executedTicks: 0, skippedTicks: 0 };
        return accumulator;
      },
      {} as Record<SystemName, SystemDebugCounter>,
    ),
  };
}

export interface CreateDebugSnapshotArgs {
  readonly runState: RunState;
  readonly tick: number;
  readonly seed: number;
  readonly counters: { snapshot(): DebugCounterValues };
}

export function createDebugSnapshot(args: CreateDebugSnapshotArgs): DebugSnapshot {
  const counters = args.counters.snapshot();

  return {
    tick: args.tick,
    seed: args.seed,
    gameplayTicks: 0,
    droppedFrameSubsteps: 0,
    lastFrameSubsteps: 0,
    estimatedStepSeconds: 0,
    runState: args.runState,
    lastRunStateChangeReason: "legacy-debug-snapshot",
    counters,
    activeEnemyCount: counters.activeEnemies,
    activeProjectileCount: counters.activeProjectiles,
    activePickupCount: counters.activePickups,
    queueSizes: {
      enemySpawn: 0,
      projectileSpawn: 0,
      pickupSpawn: 0,
      damage: 0,
      xpGrant: 0,
      despawn: 0,
      stateChange: 0,
    },
    systems: SYSTEM_ORDER.reduce(
      (accumulator, systemName) => {
        accumulator[systemName] = { executedTicks: 0, skippedTicks: 0 };
        return accumulator;
      },
      {} as Record<SystemName, SystemDebugCounter>,
    ),
  };
}
