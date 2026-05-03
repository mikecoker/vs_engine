import type { SimInput } from "../core/SimInput.ts";
export type DebugCommand = {
    type: "grant_xp";
    amount: number;
} | {
    type: "spawn_test_wave";
    count: number;
    archetypeId?: number;
} | {
    type: "kill_all_enemies";
};
export interface DebugCommandFrame {
    readonly grantXp: boolean;
    readonly spawnWave: boolean;
    readonly toggleInvulnerable: boolean;
}
export declare const EMPTY_DEBUG_COMMAND_FRAME: Readonly<DebugCommandFrame>;
export declare function extractDebugCommandFrame(input: Readonly<SimInput>): DebugCommandFrame;
export declare class DebugCommandQueue {
    private readonly commands;
    get length(): number;
    enqueueGrantXp(amount: number): void;
    enqueueSpawnTestWave(count: number, archetypeId?: number): void;
    enqueueKillAllEnemies(): void;
    drain(): DebugCommand[];
}
//# sourceMappingURL=DebugCommands.d.ts.map