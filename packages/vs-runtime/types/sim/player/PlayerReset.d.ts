import type { PlayerCharacterId } from "../content/ContentIds.ts";
import type { SimContent } from "../core/SimApi.ts";
import type { PlayerStore } from "./PlayerStore.ts";
export declare function rebuildPlayerRuntimeStats(store: PlayerStore): void;
export declare function resetPlayerStore(store: PlayerStore): void;
export declare function initializePlayerForRun(store: PlayerStore, content: SimContent, preferredPlayerId?: PlayerCharacterId): void;
//# sourceMappingURL=PlayerReset.d.ts.map