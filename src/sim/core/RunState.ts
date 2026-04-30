export const RunState = {
  Boot: "boot",
  MainMenu: "main_menu",
  StartingRun: "starting_run",
  Running: "running",
  Paused: "paused",
  LevelUpChoice: "levelup_choice",
  GameOver: "game_over",
} as const;

export type RunState = (typeof RunState)[keyof typeof RunState];

const RUN_STATE_TRANSITIONS: Readonly<Record<RunState, readonly RunState[]>> = {
  [RunState.Boot]: [RunState.MainMenu, RunState.StartingRun],
  [RunState.MainMenu]: [RunState.StartingRun],
  [RunState.StartingRun]: [RunState.Running, RunState.Paused, RunState.GameOver],
  [RunState.Running]: [RunState.Paused, RunState.LevelUpChoice, RunState.GameOver],
  [RunState.Paused]: [RunState.Running, RunState.MainMenu, RunState.GameOver],
  [RunState.LevelUpChoice]: [RunState.Running, RunState.GameOver],
  [RunState.GameOver]: [RunState.MainMenu, RunState.StartingRun],
};

export function canTransitionRunState(current: RunState, next: RunState): boolean {
  return current === next || RUN_STATE_TRANSITIONS[current].includes(next);
}

export function isSimulationAdvancingState(state: RunState): boolean {
  return state === RunState.StartingRun || state === RunState.Running;
}

export function isInteractiveOverlayState(state: RunState): boolean {
  return state === RunState.Paused || state === RunState.LevelUpChoice;
}
