import { RunState, type RunState as RunStateValue } from "../RunState.ts";
import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";

export interface StateChangeCommand {
  nextState: RunStateValue;
  reason: string;
}

export class StateChangeBuffer extends ReusableCommandBuffer<StateChangeCommand> {
  constructor() {
    super(() => ({ nextState: RunState.Boot, reason: "" }));
  }

  public enqueue(nextState: RunStateValue, reason: string): void {
    const command = this.nextRecord();
    command.nextState = nextState;
    command.reason = reason;
  }
}
