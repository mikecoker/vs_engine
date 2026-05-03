import type { DebugSnapshot } from "../../sim/debug/DebugSnapshot.ts";
export interface DebugViewModel {
    readonly tick: number;
    readonly gameplayTicks: number;
    readonly activeEnemyCount: number;
    readonly activeProjectileCount: number;
    readonly activePickupCount: number;
    readonly playerInvulnerable: boolean;
    readonly droppedFrameSubsteps: number;
    readonly lastRunStateChangeReason: string;
}
export declare function presentDebug(snapshot: DebugSnapshot): DebugViewModel;
//# sourceMappingURL=DebugPresenter.d.ts.map