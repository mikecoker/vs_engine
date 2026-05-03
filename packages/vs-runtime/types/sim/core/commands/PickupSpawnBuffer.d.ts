import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";
export interface PickupSpawnCommand {
    pickupTypeId: number;
    x: number;
    y: number;
    radius: number;
    value: number;
}
export declare class PickupSpawnBuffer extends ReusableCommandBuffer<PickupSpawnCommand> {
    constructor();
    enqueue(pickupTypeId: number, x: number, y: number, radius: number, value: number): void;
}
//# sourceMappingURL=PickupSpawnBuffer.d.ts.map