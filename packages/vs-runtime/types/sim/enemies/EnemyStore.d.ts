import type { DynamicWorldStore, World } from "../world/World.ts";
export interface EnemyStore extends DynamicWorldStore {
    velX: Float32Array;
    velY: Float32Array;
    radius: Float32Array;
    hp: Float32Array;
    maxHp: Float32Array;
    moveSpeed: Float32Array;
    contactDamage: Float32Array;
    xpValue: Uint16Array;
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
export declare function createEnemyStoreFromPlaceholder(base: DynamicWorldStore): EnemyStore;
export declare function ensureEnemyStore(world: World): EnemyStore;
export declare function syncEnemyRenderViews(store: EnemyStore): void;
//# sourceMappingURL=EnemyStore.d.ts.map