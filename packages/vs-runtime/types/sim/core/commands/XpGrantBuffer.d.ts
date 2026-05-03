import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";
export interface XpGrantCommand {
    amount: number;
}
export declare class XpGrantBuffer extends ReusableCommandBuffer<XpGrantCommand> {
    constructor();
    enqueue(amount: number): void;
}
//# sourceMappingURL=XpGrantBuffer.d.ts.map