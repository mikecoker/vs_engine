export interface ClientInputSource {
  readonly moveX?: number;
  readonly moveY?: number;
  readonly pausePressed?: boolean;
  readonly confirmPressed?: boolean;
  readonly cancelPressed?: boolean;
  readonly debugGrantXpPressed?: boolean;
  readonly debugSpawnWavePressed?: boolean;
  readonly debugToggleInvulnerablePressed?: boolean;
}
