import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";
export type DespawnEntityKind = "enemy" | "projectile" | "pickup";
export interface DespawnCommand {
    entityKind: DespawnEntityKind;
    entityId: number;
}
export declare class DespawnBuffer extends ReusableCommandBuffer<DespawnCommand> {
    constructor();
    enqueue(entityKind: DespawnEntityKind, entityId: number): void;
}
//# sourceMappingURL=DespawnBuffer.d.ts.map