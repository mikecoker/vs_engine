import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";

export interface PickupSpawnCommand {
  pickupTypeId: number;
  x: number;
  y: number;
  radius: number;
  value: number;
}

export class PickupSpawnBuffer extends ReusableCommandBuffer<PickupSpawnCommand> {
  constructor() {
    super(() => ({ pickupTypeId: 0, x: 0, y: 0, radius: 0, value: 0 }));
  }

  public enqueue(pickupTypeId: number, x: number, y: number, radius: number, value: number): void {
    const command = this.nextRecord();
    command.pickupTypeId = pickupTypeId;
    command.x = x;
    command.y = y;
    command.radius = radius;
    command.value = value;
  }
}
