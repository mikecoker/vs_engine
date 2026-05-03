export declare const RunState: {
    readonly Boot: "boot";
    readonly MainMenu: "main_menu";
    readonly StartingRun: "starting_run";
    readonly Running: "running";
    readonly Paused: "paused";
    readonly LevelUpChoice: "levelup_choice";
    readonly GameOver: "game_over";
};
export type RunState = (typeof RunState)[keyof typeof RunState];
export declare function canTransitionRunState(current: RunState, next: RunState): boolean;
export declare function isSimulationAdvancingState(state: RunState): boolean;
export declare function isInteractiveOverlayState(state: RunState): boolean;
//# sourceMappingURL=RunState.d.ts.map