import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";
export type DamageTargetKind = "player" | "enemy";
export type DamageSourceKind = "projectile" | "contact" | "debug" | "unknown";
export interface DamageCommand {
    targetKind: DamageTargetKind;
    targetId: number;
    amount: number;
    sourceKind: DamageSourceKind;
    sourceId: number;
}
export declare class DamageBuffer extends ReusableCommandBuffer<DamageCommand> {
    constructor();
    enqueue(targetKind: DamageTargetKind, targetId: number, amount: number, sourceKind: DamageSourceKind, sourceId: number): void;
}
//# sourceMappingURL=DamageBuffer.d.ts.map