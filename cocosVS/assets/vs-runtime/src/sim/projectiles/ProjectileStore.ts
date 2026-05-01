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

function resizeInt16(source: Int16Array, nextCapacity: number): Int16Array {
  const next = new Int16Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function resizeUint32(source: Uint32Array, nextCapacity: number): Uint32Array {
  const next = new Uint32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function resizeFloat32(source: Float32Array, nextCapacity: number): Float32Array {
  const next = new Float32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}

function clearProjectileSlot(store: ProjectileStore, slot: number): void {
  store.activeMask[slot] = 0;
  store.typeIds[slot] = 0;
  store.posX[slot] = 0;
  store.posY[slot] = 0;
  store.ownerTeam[slot] = 0;
  store.velX[slot] = 0;
  store.velY[slot] = 0;
  store.radius[slot] = 0;
  store.damage[slot] = 0;
  store.remainingLife[slot] = 0;
  store.remainingPierce[slot] = 0;
  store.flags[slot] = 0;
  const nextGeneration = (store.generation[slot] + 1) & 0xffff;
  store.generation[slot] = nextGeneration === 0 ? 1 : nextGeneration;
}

function copyProjectileState(store: ProjectileStore, sourceSlot: number, targetSlot: number): void {
  store.generation[targetSlot] = store.generation[sourceSlot];
  store.activeMask[targetSlot] = 1;
  store.typeIds[targetSlot] = store.typeIds[sourceSlot];
  store.posX[targetSlot] = store.posX[sourceSlot];
  store.posY[targetSlot] = store.posY[sourceSlot];
  store.ownerTeam[targetSlot] = store.ownerTeam[sourceSlot];
  store.velX[targetSlot] = store.velX[sourceSlot];
  store.velY[targetSlot] = store.velY[sourceSlot];
  store.radius[targetSlot] = store.radius[sourceSlot];
  store.damage[targetSlot] = store.damage[sourceSlot];
  store.remainingLife[targetSlot] = store.remainingLife[sourceSlot];
  store.remainingPierce[targetSlot] = store.remainingPierce[sourceSlot];
  store.flags[targetSlot] = store.flags[sourceSlot];
}

function resetProjectileStore(store: ProjectileStore): void {
  store.activeCount = 0;
  store.activeMask.fill(0);
  store.typeIds.fill(0);
  store.posX.fill(0);
  store.posY.fill(0);
  store.ownerTeam.fill(0);
  store.velX.fill(0);
  store.velY.fill(0);
  store.radius.fill(0);
  store.damage.fill(0);
  store.remainingLife.fill(0);
  store.remainingPierce.fill(0);
  store.flags.fill(0);
}

function growProjectileStore(store: ProjectileStore, nextCapacity: number): void {
  if (nextCapacity <= store.capacity) {
    return;
  }

  store.capacity = nextCapacity;
  store.activeMask = resizeUint8(store.activeMask, nextCapacity);
  store.generation = resizeUint16(store.generation, nextCapacity);
  store.typeIds = resizeUint16(store.typeIds, nextCapacity);
  store.posX = resizeFloat32(store.posX, nextCapacity);
  store.posY = resizeFloat32(store.posY, nextCapacity);
  store.ownerTeam = resizeUint8(store.ownerTeam, nextCapacity);
  store.velX = resizeFloat32(store.velX, nextCapacity);
  store.velY = resizeFloat32(store.velY, nextCapacity);
  store.radius = resizeFloat32(store.radius, nextCapacity);
  store.damage = resizeFloat32(store.damage, nextCapacity);
  store.remainingLife = resizeFloat32(store.remainingLife, nextCapacity);
  store.remainingPierce = resizeInt16(store.remainingPierce, nextCapacity);
  store.flags = resizeUint32(store.flags, nextCapacity);
}

function allocateProjectileSlot(store: ProjectileStore): number {
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

function releaseProjectileSlot(store: ProjectileStore, slot: number): boolean {
  if (!store.isAlive(slot)) {
    return false;
  }

  const lastSlot = store.activeCount - 1;
  if (slot !== lastSlot) {
    copyProjectileState(store, lastSlot, slot);
  }

  clearProjectileSlot(store, lastSlot);
  store.activeCount = lastSlot;
  return true;
}

export function createProjectileStoreFromPlaceholder(base: DynamicWorldStore): ProjectileStore {
  const store = base as ProjectileStore;
  if (typeof store.allocate === "function") {
    return store;
  }

  store.ownerTeam = new Uint8Array(base.capacity);
  store.velX = new Float32Array(base.capacity);
  store.velY = new Float32Array(base.capacity);
  store.radius = new Float32Array(base.capacity);
  store.damage = new Float32Array(base.capacity);
  store.remainingLife = new Float32Array(base.capacity);
  store.remainingPierce = new Int16Array(base.capacity);
  store.flags = new Uint32Array(base.capacity);
  store.allocate = () => allocateProjectileSlot(store);
  store.release = (slot) => releaseProjectileSlot(store, slot);
  store.isAlive = (slot) => slot >= 0 && slot < store.activeCount && store.activeMask[slot] === 1;
  store.validate = (slot, generation) =>
    slot >= 0 &&
    slot < store.activeCount &&
    store.activeMask[slot] === 1 &&
    store.generation[slot] === generation;
  store.grow = (nextCapacity) => growProjectileStore(store, nextCapacity);
  store.reset = () => resetProjectileStore(store);

  resetProjectileStore(store);
  return store;
}

export function ensureProjectileStore(world: World): ProjectileStore {
  return createProjectileStoreFromPlaceholder(world.stores.projectiles);
}

