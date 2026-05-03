import type { World } from "../world/World.ts";
import type { UpgradeChoice } from "./UpgradeChoice.ts";
export interface ProgressionStore {
    level: number;
    xp: number;
    xpToNext: number;
    queuedLevelUps: number;
    currentChoices: UpgradeChoice[];
    activeCurveIndex: number;
    passiveUpgradeLevels: Uint8Array;
    initialized: boolean;
    lastResetTick: number;
}
export declare function createProgressionStore(passiveUpgradeCount?: number): ProgressionStore;
export declare function resolvePassiveUpgradeCount(content: Pick<World, "content">["content"]): number;
export declare function ensureProgressionStore(world: World): ProgressionStore;
export declare function clearUpgradeChoices(store: ProgressionStore): void;
//# sourceMappingURL=ProgressionStore.d.ts.map