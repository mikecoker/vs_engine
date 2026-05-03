import type { RunState } from "../../sim/core/RunState.ts";
export interface RunStateViewModel {
    readonly runState: RunState;
    readonly showPauseOverlay: boolean;
    readonly showLevelUpOverlay: boolean;
    readonly showGameOverOverlay: boolean;
}
export declare function presentRunState(runState: RunState): RunStateViewModel;
//# sourceMappingURL=RunStatePresenter.d.ts.map