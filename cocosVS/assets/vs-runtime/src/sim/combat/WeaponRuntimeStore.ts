import type { ContentRegistry } from "../content/ContentRegistry.ts";
import type { PlayerCharacterId, WeaponId } from "../content/ContentIds.ts";
import type { SimContent } from "../core/SimApi.ts";
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

function isContentRegistry(value: SimContent): value is SimContent & ContentRegistry {
  const registry = value as Partial<ContentRegistry>;
  return (
    typeof value === "object" &&
    value !== null &&
    !!registry.playerCharacters &&
    !!registry.weapons &&
    Array.isArray(registry.playerCharacters.defs) &&
    Array.isArray(registry.weapons.defs)
  );
}

function createWeaponRuntimeStore(initialCapacity = 4): WeaponRuntimeStore {
  return {
    capacity: initialCapacity,
    activeCount: 0,
    ownerCharacterId: null,
    weaponTypeIds: new Uint16Array(initialCapacity),
    weaponLevels: new Uint8Array(initialCapacity),
    cooldownRemaining: new Float32Array(initialCapacity),
    lastFireElapsedSeconds: new Float32Array(initialCapacity),
    renderTypeIds: new Uint16Array(initialCapacity),
    renderLevels: new Uint8Array(initialCapacity),
    renderCooldownRemaining: new Float32Array(initialCapacity),
    renderLastFireElapsedSeconds: new Float32Array(initialCapacity),
    reset() {
      this.activeCount = 0;
      this.ownerCharacterId = null;
      this.weaponTypeIds.fill(0);
      this.weaponLevels.fill(0);
      this.cooldownRemaining.fill(0);
      this.lastFireElapsedSeconds.fill(-1);
      this.renderTypeIds.fill(0);
      this.renderLevels.fill(0);
      this.renderCooldownRemaining.fill(0);
      this.renderLastFireElapsedSeconds.fill(-1);
    },
    ensureCapacity(nextCapacity: number) {
      if (nextCapacity <= this.capacity) {
        return;
      }

      const nextWeaponIds = new Uint16Array(nextCapacity);
      nextWeaponIds.set(this.weaponTypeIds.subarray(0, this.activeCount));
      this.weaponTypeIds = nextWeaponIds;

      const nextLevels = new Uint8Array(nextCapacity);
      nextLevels.set(this.weaponLevels.subarray(0, this.activeCount));
      this.weaponLevels = nextLevels;

      const nextCooldowns = new Float32Array(nextCapacity);
      nextCooldowns.set(this.cooldownRemaining.subarray(0, this.activeCount));
      this.cooldownRemaining = nextCooldowns;

      const nextLastFire = new Float32Array(nextCapacity);
      nextLastFire.fill(-1);
      nextLastFire.set(this.lastFireElapsedSeconds.subarray(0, this.activeCount));
      this.lastFireElapsedSeconds = nextLastFire;

      const nextRenderWeaponIds = new Uint16Array(nextCapacity);
      nextRenderWeaponIds.set(this.renderTypeIds.subarray(0, this.activeCount));
      this.renderTypeIds = nextRenderWeaponIds;

      const nextRenderLevels = new Uint8Array(nextCapacity);
      nextRenderLevels.set(this.renderLevels.subarray(0, this.activeCount));
      this.renderLevels = nextRenderLevels;

      const nextRenderCooldowns = new Float32Array(nextCapacity);
      nextRenderCooldowns.set(this.renderCooldownRemaining.subarray(0, this.activeCount));
      this.renderCooldownRemaining = nextRenderCooldowns;

      const nextRenderLastFire = new Float32Array(nextCapacity);
      nextRenderLastFire.fill(-1);
      nextRenderLastFire.set(this.renderLastFireElapsedSeconds.subarray(0, this.activeCount));
      this.renderLastFireElapsedSeconds = nextRenderLastFire;

      this.capacity = nextCapacity;
    },
  };
}

function loadWeaponIds(
  store: WeaponRuntimeStore,
  content: ContentRegistry,
  ownerCharacterId: PlayerCharacterId,
  weaponIds: readonly WeaponId[],
): void {
  store.reset();
  store.ensureCapacity(Math.max(store.capacity, weaponIds.length));
  store.ownerCharacterId = ownerCharacterId;

  for (let index = 0; index < weaponIds.length; index += 1) {
    store.weaponTypeIds[index] = content.weapons.getIndex(weaponIds[index]);
    store.weaponLevels[index] = 1;
    store.cooldownRemaining[index] = 0;
    store.lastFireElapsedSeconds[index] = -1;
  }

  store.activeCount = weaponIds.length;
}

export function ensureWeaponRuntimeStore(world: World): WeaponRuntimeStore {
  if (!world.scratch.weaponRuntimeStore) {
    world.scratch.weaponRuntimeStore = createWeaponRuntimeStore();
  }

  const store = world.scratch.weaponRuntimeStore;
  const player = world.stores.player;
  if (!player.exists || !player.characterId || !isContentRegistry(world.content)) {
    return store;
  }

  if (store.ownerCharacterId !== player.characterId || store.activeCount === 0) {
    const playerDef = world.content.playerCharacters.get(player.characterId);
    loadWeaponIds(store, world.content, player.characterId, playerDef.starterWeaponIds);
  }

  return store;
}

export function syncWeaponRenderViews(store: WeaponRuntimeStore): void {
  for (let index = 0; index < store.activeCount; index += 1) {
    store.renderTypeIds[index] = store.weaponTypeIds[index];
    store.renderLevels[index] = store.weaponLevels[index];
    store.renderCooldownRemaining[index] = store.cooldownRemaining[index];
    store.renderLastFireElapsedSeconds[index] = store.lastFireElapsedSeconds[index];
  }
}
