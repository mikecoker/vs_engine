export interface DebugCounterValues {
    activeEnemies: number;
    activeProjectiles: number;
    activePickups: number;
    damageRequestsProcessed: number;
    spawnCommandsProcessed: number;
    ticksStepped: number;
    elapsedSeconds: number;
    lastFrameSeconds: number;
}
export declare class DebugCounters {
    activeEnemies: number;
    activeProjectiles: number;
    activePickups: number;
    damageRequestsProcessed: number;
    spawnCommandsProcessed: number;
    ticksStepped: number;
    elapsedSeconds: number;
    lastFrameSeconds: number;
    reset(): void;
    beginFrame(frameSeconds: number): void;
    recordTick(dt: number): void;
    recordDamageRequests(count?: number): void;
    recordSpawnCommands(count?: number): void;
    setActiveCounts(activeEnemies: number, activeProjectiles: number, activePickups: number): void;
    snapshot(): DebugCounterValues;
    private assign;
}
//# sourceMappingURL=DebugCounters.d.ts.map