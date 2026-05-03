import type { ProgressionRenderSnapshot, PlayerRenderSnapshot } from "../../sim/core/RenderSnapshot.ts";
export interface HudViewModel {
    readonly hp: number;
    readonly maxHp: number;
    readonly level: number;
    readonly xp: number;
    readonly xpToNext: number;
    readonly elapsedSeconds: number;
}
export declare function presentHud(player: PlayerRenderSnapshot, progression: ProgressionRenderSnapshot, elapsedSeconds: number): HudViewModel;
//# sourceMappingURL=HudPresenter.d.ts.map