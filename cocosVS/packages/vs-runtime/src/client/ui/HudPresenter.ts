import type { ProgressionRenderSnapshot, PlayerRenderSnapshot } from "../../sim/core/RenderSnapshot";

export interface HudViewModel {
  readonly hp: number;
  readonly maxHp: number;
  readonly level: number;
  readonly xp: number;
  readonly xpToNext: number;
  readonly elapsedSeconds: number;
}

export function presentHud(
  player: PlayerRenderSnapshot,
  progression: ProgressionRenderSnapshot,
  elapsedSeconds: number,
): HudViewModel {
  return {
    hp: player.hp,
    maxHp: player.maxHp,
    level: progression.level,
    xp: progression.xp,
    xpToNext: progression.xpToNext,
    elapsedSeconds,
  };
}
