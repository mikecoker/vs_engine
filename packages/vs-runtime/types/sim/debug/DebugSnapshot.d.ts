import type { RunState } from "../core/RunState.ts";
import type { DebugCounterValues } from "./DebugCounters.ts";
export declare const SYSTEM_ORDER: readonly ["RunStateSystem", "InputApplySystem", "SpawnDirectorSystem", "ApplySpawnCommandsSystem", "PlayerMovementSystem", "PreMovementSpatialGridBuildSystem", "EnemyMovementSystem", "WeaponFireSystem", "ApplyProjectileSpawnCommandsSystem", "ProjectileMovementSystem", "SpatialGridBuildSystem", "ContactDamageQuerySystem", "ProjectileHitQuerySystem", "DamageResolveSystem", "DeathAndDropSystem", "PickupMagnetSystem", "PickupCollectSystem", "ProgressionSystem", "CleanupSystem", "RenderExtractSystem"];
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
    readonly playerInvulnerable: boolean;
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
export declare function createDebugCounters(): DebugCounters;
export interface CreateDebugSnapshotArgs {
    readonly runState: RunState;
    readonly tick: number;
    readonly seed: number;
    readonly playerInvulnerable: boolean;
    readonly counters: {
        snapshot(): DebugCounterValues;
    };
}
export declare function createDebugSnapshot(args: CreateDebugSnapshotArgs): DebugSnapshot;
//# sourceMappingURL=DebugSnapshot.d.ts.map