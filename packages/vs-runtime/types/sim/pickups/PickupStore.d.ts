import type { PickupDef } from "../content/ContentTypes.ts";
import type { SimContent } from "../core/SimApi.ts";
import type { DynamicWorldStore, World } from "../world/World.ts";
export interface PickupStore extends DynamicWorldStore {
    velX: Float32Array;
    velY: Float32Array;
    radius: Float32Array;
    value: Uint16Array;
    magnetized: Uint8Array;
    magnetTimeRemaining: Float32Array;
    magnetSpeed: Float32Array;
    activeSlots: Uint32Array;
    activeSlotIndex: Int32Array;
    freeList: Uint32Array;
    freeCount: number;
    nextUnusedIndex: number;
    renderTypeIds: Uint16Array;
    renderPosX: Float32Array;
    renderPosY: Float32Array;
    allocate(): number;
    release(slot: number): boolean;
    isAlive(slot: number): boolean;
    validate(slot: number, generation: number): boolean;
    grow(nextCapacity: number): void;
}
export declare function getPickupDefByIndex(content: SimContent, pickupTypeId: number): PickupDef | null;
export declare function createPickupStoreFromPlaceholder(base: DynamicWorldStore): PickupStore;
export declare function ensurePickupStore(world: World): PickupStore;
export declare function syncPickupRenderViews(store: PickupStore): void;
//# sourceMappingURL=PickupStore.d.ts.map