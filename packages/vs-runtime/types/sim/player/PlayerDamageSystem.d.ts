import type { DamageSourceKind } from "../core/commands/DamageBuffer.ts";
import type { FrameContext } from "../core/FrameContext.ts";
import type { PlayerStore } from "./PlayerStore.ts";
export interface PlayerDamageResult {
    readonly applied: boolean;
    readonly amountApplied: number;
    readonly killedPlayer: boolean;
}
export declare function tickPlayerInvulnerability(player: PlayerStore, dt: number): void;
export declare function applyDamageToPlayer(player: PlayerStore, amount: number, _sourceKind: DamageSourceKind): PlayerDamageResult;
export declare function stepPlayerDamageSystem(context: FrameContext): void;
//# sourceMappingURL=PlayerDamageSystem.d.ts.map