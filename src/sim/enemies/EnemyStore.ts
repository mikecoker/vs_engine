import type { DynamicWorldStore, World } from "../world/World";

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

const ACTIVE_SLOT_EMPTY = -1;

function createUint32Range(capacity: number): Uint32Array {
  const values = new Uint32Array(capacity);
  for (let index = 0; index < capacity; index += 1) {
    values[index] = index;
  }

  return values;
}

function createInt32Filled(capacity: number, value: number): Int32Array {
  const values = new Int32Array(capacity);
  values.fill(value);
  return values;
}

function resetEnemyStore(store: EnemyStore): void {
  store.activeCount = 0;
  store.activeMask.fill(0);
  store.generation.fill(0);
  store.typeIds.fill(0);
  store.posX.fill(0);
  store.posY.fill(0);
  store.velX.fill(0);
  store.velY.fill(0);
  store.radius.fill(0);
  store.hp.fill(0);
  store.maxHp.fill(0);
  store.moveSpeed.fill(0);
  store.contactDamage.fill(0);
  store.xpValue.fill(0);
  store.flags.fill(0);
  store.activeSlots.fill(0);
  store.activeSlotIndex.fill(ACTIVE_SLOT_EMPTY);
  store.freeList = createUint32Range(store.capacity);
  store.freeCount = store.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds.fill(0);
  store.renderPosX.fill(0);
  store.renderPosY.fill(0);
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

function resizeUint32(source: Uint32Array, nextCapacity: number): Uint32Array {
  const next = new Uint32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function resizeInt32(source: Int32Array, nextCapacity: number, fillValue: number): Int32Array {
  const next = new Int32Array(nextCapacity);
  next.fill(fillValue);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function resizeFloat32(source: Float32Array, nextCapacity: number): Float32Array {
  const next = new Float32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function growEnemyStore(store: EnemyStore, nextCapacity: number): void {
  if (nextCapacity <= store.capacity) {
    return;
  }

  const previousCapacity = store.capacity;

  store.capacity = nextCapacity;
  store.activeMask = resizeUint8(store.activeMask, nextCapacity);
  store.generation = resizeUint16(store.generation, nextCapacity);
  store.typeIds = resizeUint16(store.typeIds, nextCapacity);
  store.posX = resizeFloat32(store.posX, nextCapacity);
  store.posY = resizeFloat32(store.posY, nextCapacity);
  store.velX = resizeFloat32(store.velX, nextCapacity);
  store.velY = resizeFloat32(store.velY, nextCapacity);
  store.radius = resizeFloat32(store.radius, nextCapacity);
  store.hp = resizeFloat32(store.hp, nextCapacity);
  store.maxHp = resizeFloat32(store.maxHp, nextCapacity);
  store.moveSpeed = resizeFloat32(store.moveSpeed, nextCapacity);
  store.contactDamage = resizeFloat32(store.contactDamage, nextCapacity);
  store.xpValue = resizeUint16(store.xpValue, nextCapacity);
  store.flags = resizeUint32(store.flags, nextCapacity);
  store.activeSlots = resizeUint32(store.activeSlots, nextCapacity);
  store.activeSlotIndex = resizeInt32(store.activeSlotIndex, nextCapacity, ACTIVE_SLOT_EMPTY);
  store.renderTypeIds = resizeUint16(store.renderTypeIds, nextCapacity);
  store.renderPosX = resizeFloat32(store.renderPosX, nextCapacity);
  store.renderPosY = resizeFloat32(store.renderPosY, nextCapacity);

  const nextFreeList = new Uint32Array(nextCapacity);
  nextFreeList.set(store.freeList.subarray(0, store.freeCount));
  for (let index = previousCapacity; index < nextCapacity; index += 1) {
    nextFreeList[store.freeCount] = index;
    store.freeCount += 1;
  }
  store.freeList = nextFreeList;
}

function allocateEnemySlot(store: EnemyStore): number {
  if (store.freeCount === 0) {
    store.grow(Math.max(1, store.capacity * 2));
  }

  store.freeCount -= 1;
  const slot = store.freeList[store.freeCount];

  store.activeMask[slot] = 1;
  if (store.generation[slot] === 0) {
    store.generation[slot] = 1;
  }

  store.activeSlotIndex[slot] = store.activeCount;
  store.activeSlots[store.activeCount] = slot;
  store.activeCount += 1;
  if (slot >= store.nextUnusedIndex) {
    store.nextUnusedIndex = slot + 1;
  }

  return slot;
}

function releaseEnemySlot(store: EnemyStore, slot: number): boolean {
  if (!store.isAlive(slot)) {
    return false;
  }

  const denseIndex = store.activeSlotIndex[slot];
  const lastDenseIndex = store.activeCount - 1;
  const movedSlot = store.activeSlots[lastDenseIndex];

  store.activeCount = lastDenseIndex;
  store.activeMask[slot] = 0;
  store.activeSlotIndex[slot] = ACTIVE_SLOT_EMPTY;

  if (denseIndex !== lastDenseIndex) {
    store.activeSlots[denseIndex] = movedSlot;
    store.activeSlotIndex[movedSlot] = denseIndex;
  }

  store.activeSlots[lastDenseIndex] = 0;
  store.typeIds[slot] = 0;
  store.posX[slot] = 0;
  store.posY[slot] = 0;
  store.velX[slot] = 0;
  store.velY[slot] = 0;
  store.radius[slot] = 0;
  store.hp[slot] = 0;
  store.maxHp[slot] = 0;
  store.moveSpeed[slot] = 0;
  store.contactDamage[slot] = 0;
  store.xpValue[slot] = 0;
  store.flags[slot] = 0;

  const nextGeneration = (store.generation[slot] + 1) & 0xffff;
  store.generation[slot] = nextGeneration === 0 ? 1 : nextGeneration;
  store.freeList[store.freeCount] = slot;
  store.freeCount += 1;
  return true;
}

export function createEnemyStoreFromPlaceholder(base: DynamicWorldStore): EnemyStore {
  const store = base as EnemyStore;

  if (typeof store.allocate === "function") {
    return store;
  }

  store.velX = new Float32Array(base.capacity);
  store.velY = new Float32Array(base.capacity);
  store.radius = new Float32Array(base.capacity);
  store.hp = new Float32Array(base.capacity);
  store.maxHp = new Float32Array(base.capacity);
  store.moveSpeed = new Float32Array(base.capacity);
  store.contactDamage = new Float32Array(base.capacity);
  store.xpValue = new Uint16Array(base.capacity);
  store.flags = new Uint32Array(base.capacity);
  store.activeSlots = new Uint32Array(base.capacity);
  store.activeSlotIndex = createInt32Filled(base.capacity, ACTIVE_SLOT_EMPTY);
  store.freeList = createUint32Range(base.capacity);
  store.freeCount = base.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds = new Uint16Array(base.capacity);
  store.renderPosX = new Float32Array(base.capacity);
  store.renderPosY = new Float32Array(base.capacity);
  store.allocate = () => allocateEnemySlot(store);
  store.release = (slot) => releaseEnemySlot(store, slot);
  store.isAlive = (slot) => slot >= 0 && slot < store.capacity && store.activeMask[slot] === 1;
  store.validate = (slot, generation) =>
    slot >= 0 &&
    slot < store.capacity &&
    store.activeMask[slot] === 1 &&
    store.generation[slot] === generation;
  store.grow = (nextCapacity) => growEnemyStore(store, nextCapacity);
  store.reset = () => resetEnemyStore(store);

  resetEnemyStore(store);
  return store;
}

export function ensureEnemyStore(world: World): EnemyStore {
  return createEnemyStoreFromPlaceholder(world.stores.enemies);
}

export function syncEnemyRenderViews(store: EnemyStore): void {
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    store.renderTypeIds[denseIndex] = store.typeIds[slot];
    store.renderPosX[denseIndex] = store.posX[slot];
    store.renderPosY[denseIndex] = store.posY[slot];
  }
}

export function forEachActiveEnemySlot(
  store: EnemyStore,
  visit: (slot: number, denseIndex: number) => void,
): void {
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    visit(store.activeSlots[denseIndex], denseIndex);
  }
}
