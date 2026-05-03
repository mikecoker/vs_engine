import { type RunState as RunStateValue } from "../RunState.ts";
import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";
export interface StateChangeCommand {
    nextState: RunStateValue;
    reason: string;
}
export declare class StateChangeBuffer extends ReusableCommandBuffer<StateChangeCommand> {
    constructor();
    enqueue(nextState: RunStateValue, reason: string): void;
}
//# sourceMappingURL=StateChangeBuffer.d.ts.map