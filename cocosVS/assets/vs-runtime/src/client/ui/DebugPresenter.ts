import type { DebugSnapshot } from "../../sim/debug/DebugSnapshot.ts";

export interface DebugViewModel {
  readonly tick: number;
  readonly gameplayTicks: number;
  readonly activeEnemyCount: number;
  readonly activeProjectileCount: number;
  readonly activePickupCount: number;
  readonly droppedFrameSubsteps: number;
  readonly lastRunStateChangeReason: string;
}

export function presentDebug(snapshot: DebugSnapshot): DebugViewModel {
  return {
    tick: snapshot.tick,
    gameplayTicks: snapshot.gameplayTicks,
    activeEnemyCount: snapshot.activeEnemyCount,
    activeProjectileCount: snapshot.activeProjectileCount,
    activePickupCount: snapshot.activePickupCount,
    droppedFrameSubsteps: snapshot.droppedFrameSubsteps,
    lastRunStateChangeReason: snapshot.lastRunStateChangeReason,
  };
}
