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

export const EMPTY_SIM_INPUT: Readonly<SimInput> = {
  moveX: 0,
  moveY: 0,
  pausePressed: false,
  confirmPressed: false,
  cancelPressed: false,
  debugGrantXpPressed: false,
  debugSpawnWavePressed: false,
  debugToggleInvulnerablePressed: false,
};
