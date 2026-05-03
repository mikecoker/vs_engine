import type { World } from "../world/World.ts";
import type { LevelUpPayload } from "./UpgradeChoice.ts";
export declare function getLevelUpPayload(world: World): LevelUpPayload | null;
export declare function ensureLevelUpChoices(world: World): LevelUpPayload | null;
export declare function selectUpgrade(world: World, choiceIndex: number): boolean;
//# sourceMappingURL=ProgressionApi.d.ts.map