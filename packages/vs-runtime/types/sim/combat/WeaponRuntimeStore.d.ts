import type { PlayerCharacterId } from "../content/ContentIds.ts";
import type { World } from "../world/World.ts";
export interface WeaponRuntimeStore {
    capacity: number;
    activeCount: number;
    ownerCharacterId: PlayerCharacterId | null;
    weaponTypeIds: Uint16Array;
    weaponLevels: Uint8Array;
    cooldownRemaining: Float32Array;
    lastFireElapsedSeconds: Float32Array;
    renderTypeIds: Uint16Array;
    renderLevels: Uint8Array;
    renderCooldownRemaining: Float32Array;
    renderLastFireElapsedSeconds: Float32Array;
    reset(): void;
    ensureCapacity(nextCapacity: number): void;
}
declare module "../world/World" {
    interface WorldScratch {
        weaponRuntimeStore?: WeaponRuntimeStore;
    }
}
export declare function ensureWeaponRuntimeStore(world: World): WeaponRuntimeStore;
export declare function syncWeaponRenderViews(store: WeaponRuntimeStore): void;
//# sourceMappingURL=WeaponRuntimeStore.d.ts.map