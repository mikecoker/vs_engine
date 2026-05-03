import type { World } from "../world/World.ts";
export interface EnemyDeathInfo {
    readonly slot: number;
    readonly archetypeIndex: number;
    readonly x: number;
    readonly y: number;
    readonly xpValue: number;
}
export declare function createEnemyDeathInfo(world: World, slot: number): EnemyDeathInfo | null;
export declare function releaseEnemy(world: World, slot: number): boolean;
//# sourceMappingURL=EnemyLifecycle.d.ts.map