import type { PickupDef } from "../content/ContentTypes";
import type { SimContent } from "../core/SimApi";
import type { DynamicWorldStore, World } from "../world/World";

export interface PickupStore extends DynamicWorldStore {
  velX: Float32Array;
  velY: Float32Array;
  radius: Float32Array;
  value: Uint16Array;
  magnetized: Uint8Array;
  magnetSpeed: Float32Array;
  allocate(): number;
  release(slot: number): boolean;
  isAlive(slot: number): boolean;
  validate(slot: number, generation: number): boolean;
  grow(nextCapacity: number): void;
}

function resizeUint8(source: Uint8Array, nextCapacity: number): Uint8Array {
  const next = new Uint8Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function resizeUint16(source: Uint16Array, nextCapacity: number): Uint16Array {
  const next = new Uint16Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function resizeFloat32(source: Float32Array, nextCapacity: number): Float32Array {
  const next = new Float32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function resetPickupStore(store: PickupStore): void {
  store.activeCount = 0;
  store.activeMask.fill(0);
  store.typeIds.fill(0);
  store.posX.fill(0);
  store.posY.fill(0);
  store.velX.fill(0);
  store.velY.fill(0);
  store.radius.fill(0);
  store.value.fill(0);
  store.magnetized.fill(0);
  store.magnetSpeed.fill(0);
}

function growPickupStore(store: PickupStore, nextCapacity: number): void {
  if (nextCapacity <= store.capacity) {
    return;
  }

  store.capacity = nextCapacity;
  store.activeMask = resizeUint8(store.activeMask, nextCapacity);
  store.generation = resizeUint16(store.generation, nextCapacity);
  store.typeIds = resizeUint16(store.typeIds, nextCapacity);
  store.posX = resizeFloat32(store.posX, nextCapacity);
  store.posY = resizeFloat32(store.posY, nextCapacity);
  store.velX = resizeFloat32(store.velX, nextCapacity);
  store.velY = resizeFloat32(store.velY, nextCapacity);
  store.radius = resizeFloat32(store.radius, nextCapacity);
  store.value = resizeUint16(store.value, nextCapacity);
  store.magnetized = resizeUint8(store.magnetized, nextCapacity);
  store.magnetSpeed = resizeFloat32(store.magnetSpeed, nextCapacity);
}

function copyPickupState(store: PickupStore, sourceSlot: number, targetSlot: number): void {
  store.generation[targetSlot] = store.generation[sourceSlot];
  store.activeMask[targetSlot] = 1;
  store.typeIds[targetSlot] = store.typeIds[sourceSlot];
  store.posX[targetSlot] = store.posX[sourceSlot];
  store.posY[targetSlot] = store.posY[sourceSlot];
  store.velX[targetSlot] = store.velX[sourceSlot];
  store.velY[targetSlot] = store.velY[sourceSlot];
  store.radius[targetSlot] = store.radius[sourceSlot];
  store.value[targetSlot] = store.value[sourceSlot];
  store.magnetized[targetSlot] = store.magnetized[sourceSlot];
  store.magnetSpeed[targetSlot] = store.magnetSpeed[sourceSlot];
}

function clearPickupSlot(store: PickupStore, slot: number): void {
  store.activeMask[slot] = 0;
  store.typeIds[slot] = 0;
  store.posX[slot] = 0;
  store.posY[slot] = 0;
  store.velX[slot] = 0;
  store.velY[slot] = 0;
  store.radius[slot] = 0;
  store.value[slot] = 0;
  store.magnetized[slot] = 0;
  store.magnetSpeed[slot] = 0;
  const nextGeneration = (store.generation[slot] + 1) & 0xffff;
  store.generation[slot] = nextGeneration === 0 ? 1 : nextGeneration;
}

function allocatePickupSlot(store: PickupStore): number {
  if (store.activeCount >= store.capacity) {
    store.grow(Math.max(1, store.capacity * 2));
  }

  const slot = store.activeCount;
  store.activeCount += 1;
  store.activeMask[slot] = 1;
  if (store.generation[slot] === 0) {
    store.generation[slot] = 1;
  }
  return slot;
}

function releasePickupSlot(store: PickupStore, slot: number): boolean {
  if (!store.isAlive(slot)) {
    return false;
  }

  const lastSlot = store.activeCount - 1;
  if (slot !== lastSlot) {
    copyPickupState(store, lastSlot, slot);
  }

  clearPickupSlot(store, lastSlot);
  store.activeCount = lastSlot;
  return true;
}

function isContentRegistry(content: SimContent): content is SimContent & { pickups: { defs: readonly PickupDef[] } } {
  const registry = content as Partial<{ pickups: { defs?: unknown } }>;
  return (
    typeof content === "object" &&
    content !== null &&
    !!registry.pickups &&
    Array.isArray(registry.pickups.defs)
  );
}

export function getPickupDefByIndex(content: SimContent, pickupTypeId: number): PickupDef | null {
  if (!isContentRegistry(content) || pickupTypeId < 0) {
    return null;
  }

  return content.pickups.defs[pickupTypeId] ?? null;
}

export function createPickupStoreFromPlaceholder(base: DynamicWorldStore): PickupStore {
  const store = base as PickupStore;
  if (typeof store.allocate === "function") {
    return store;
  }

  store.velX = new Float32Array(base.capacity);
  store.velY = new Float32Array(base.capacity);
  store.radius = new Float32Array(base.capacity);
  store.value = new Uint16Array(base.capacity);
  store.magnetized = new Uint8Array(base.capacity);
  store.magnetSpeed = new Float32Array(base.capacity);
  store.allocate = () => allocatePickupSlot(store);
  store.release = (slot) => releasePickupSlot(store, slot);
  store.isAlive = (slot) => slot >= 0 && slot < store.activeCount && store.activeMask[slot] === 1;
  store.validate = (slot, generation) =>
    slot >= 0 &&
    slot < store.activeCount &&
    store.activeMask[slot] === 1 &&
    store.generation[slot] === generation;
  store.grow = (nextCapacity) => growPickupStore(store, nextCapacity);
  store.reset = () => resetPickupStore(store);

  resetPickupStore(store);
  return store;
}

export function ensurePickupStore(world: World): PickupStore {
  return createPickupStoreFromPlaceholder(world.stores.pickups);
}
