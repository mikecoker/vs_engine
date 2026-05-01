import type { RunState } from "../../sim/core/RunState";

export interface RunStateViewModel {
  readonly runState: RunState;
  readonly showPauseOverlay: boolean;
  readonly showLevelUpOverlay: boolean;
  readonly showGameOverOverlay: boolean;
}

export function presentRunState(runState: RunState): RunStateViewModel {
  return {
    runState,
    showPauseOverlay: runState === "paused",
    showLevelUpOverlay: runState === "levelup_choice",
    showGameOverOverlay: runState === "game_over",
  };
}
