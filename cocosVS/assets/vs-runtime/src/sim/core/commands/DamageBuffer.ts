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

export class DamageBuffer extends ReusableCommandBuffer<DamageCommand> {
  constructor() {
    super(() => ({
      targetKind: "enemy",
      targetId: -1,
      amount: 0,
      sourceKind: "unknown",
      sourceId: -1,
    }));
  }

  public enqueue(
    targetKind: DamageTargetKind,
    targetId: number,
    amount: number,
    sourceKind: DamageSourceKind,
    sourceId: number,
  ): void {
    const command = this.nextRecord();
    command.targetKind = targetKind;
    command.targetId = targetId;
    command.amount = amount;
    command.sourceKind = sourceKind;
    command.sourceId = sourceId;
  }
}
