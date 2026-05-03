import type { DynamicWorldStore, World } from "../world/World.ts";
export interface ProjectileStore extends DynamicWorldStore {
    ownerTeam: Uint8Array;
    velX: Float32Array;
    velY: Float32Array;
    radius: Float32Array;
    damage: Float32Array;
    remainingLife: Float32Array;
    remainingPierce: Int16Array;
    flags: Uint32Array;
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
export declare function createProjectileStoreFromPlaceholder(base: DynamicWorldStore): ProjectileStore;
export declare function ensureProjectileStore(world: World): ProjectileStore;
export declare function syncProjectileRenderViews(store: ProjectileStore): void;
//# sourceMappingURL=ProjectileStore.d.ts.map