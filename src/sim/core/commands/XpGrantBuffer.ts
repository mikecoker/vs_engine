import { ReusableCommandBuffer } from "./ReusableCommandBuffer";

export interface XpGrantCommand {
  amount: number;
}

export class XpGrantBuffer extends ReusableCommandBuffer<XpGrantCommand> {
  constructor() {
    super(() => ({ amount: 0 }));
  }

  public enqueue(amount: number): void {
    this.nextRecord().amount = amount;
  }
}
