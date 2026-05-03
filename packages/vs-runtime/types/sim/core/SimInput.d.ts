export interface SimInput {
    readonly moveX: number;
    readonly moveY: number;
    readonly pausePressed: boolean;
    readonly confirmPressed: boolean;
    readonly cancelPressed: boolean;
    readonly debugGrantXpPressed?: boolean;
    readonly debugSpawnWavePressed?: boolean;
    readonly debugToggleInvulnerablePressed?: boolean;
}
export declare const EMPTY_SIM_INPUT: Readonly<SimInput>;
//# sourceMappingURL=SimInput.d.ts.map