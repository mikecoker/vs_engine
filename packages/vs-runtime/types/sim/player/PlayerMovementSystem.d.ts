import type { FrameContext } from "../core/FrameContext.ts";
import type { PlayerStore } from "./PlayerStore.ts";
export interface NormalizedMovementVector {
    readonly x: number;
    readonly y: number;
    readonly magnitude: number;
}
export declare function normalizeMovementInput(moveX: number, moveY: number): NormalizedMovementVector;
export declare function stepPlayerMovement(context: FrameContext): void;
export declare function getPlayerMoveSpeed(player: Readonly<PlayerStore>): number;
//# sourceMappingURL=PlayerMovementSystem.d.ts.map