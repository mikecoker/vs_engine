import { ReusableCommandBuffer } from "./ReusableCommandBuffer";

export interface EnemySpawnCommand {
  archetypeId: number;
  x: number;
  y: number;
}

export class EnemySpawnBuffer extends ReusableCommandBuffer<EnemySpawnCommand> {
  constructor() {
    super(() => ({ archetypeId: 0, x: 0, y: 0 }));
  }

  public enqueue(archetypeId: number, x: number, y: number): void {
    const command = this.nextRecord();
    command.archetypeId = archetypeId;
    command.x = x;
    command.y = y;
  }
}
