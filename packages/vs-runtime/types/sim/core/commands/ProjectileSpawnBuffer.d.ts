import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";
export interface ProjectileSpawnCommand {
    projectileTypeId: number;
    ownerTeam: number;
    x: number;
    y: number;
    velX: number;
    velY: number;
    radius: number;
    damage: number;
    remainingLife: number;
    remainingPierce: number;
    flags: number;
}
export declare class ProjectileSpawnBuffer extends ReusableCommandBuffer<ProjectileSpawnCommand> {
    constructor();
    enqueue(commandInput: Readonly<ProjectileSpawnCommand>): void;
    enqueueValues(projectileTypeId: number, ownerTeam: number, x: number, y: number, velX: number, velY: number, radius: number, damage: number, remainingLife: number, remainingPierce: number, flags: number): void;
}
//# sourceMappingURL=ProjectileSpawnBuffer.d.ts.map