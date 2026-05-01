import type { LevelUpPayload } from "../../sim/progression/UpgradeChoice";

export interface LevelUpViewModel {
  readonly visible: boolean;
  readonly level: number;
  readonly xp: number;
  readonly xpToNext: number;
  readonly queuedLevelUps: number;
  readonly choices: LevelUpPayload["choices"];
}

export function presentLevelUp(payload: LevelUpPayload | null): LevelUpViewModel {
  if (!payload) {
    return {
      visible: false,
      level: 0,
      xp: 0,
      xpToNext: 0,
      queuedLevelUps: 0,
      choices: [],
    };
  }

  return {
    visible: true,
    level: payload.level,
    xp: payload.xp,
    xpToNext: payload.xpToNext,
    queuedLevelUps: payload.queuedLevelUps,
    choices: payload.choices,
  };
}
