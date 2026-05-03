import type { LevelUpPayload } from "../../sim/progression/UpgradeChoice.ts";
export interface LevelUpViewModel {
    readonly visible: boolean;
    readonly level: number;
    readonly xp: number;
    readonly xpToNext: number;
    readonly queuedLevelUps: number;
    readonly choices: LevelUpPayload["choices"];
}
export declare function presentLevelUp(payload: LevelUpPayload | null): LevelUpViewModel;
//# sourceMappingURL=LevelUpPresenter.d.ts.map