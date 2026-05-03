import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";
export interface EnemySpawnCommand {
    archetypeId: number;
    x: number;
    y: number;
}
export declare class EnemySpawnBuffer extends ReusableCommandBuffer<EnemySpawnCommand> {
    constructor();
    enqueue(archetypeId: number, x: number, y: number): void;
}
//# sourceMappingURL=EnemySpawnBuffer.d.ts.map