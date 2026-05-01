import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";

export type DespawnEntityKind = "enemy" | "projectile" | "pickup";

export interface DespawnCommand {
  entityKind: DespawnEntityKind;
  entityId: number;
}

export class DespawnBuffer extends ReusableCommandBuffer<DespawnCommand> {
  constructor() {
    super(() => ({ entityKind: "enemy", entityId: -1 }));
  }

  public enqueue(entityKind: DespawnEntityKind, entityId: number): void {
    const command = this.nextRecord();
    command.entityKind = entityKind;
    command.entityId = entityId;
  }
}
