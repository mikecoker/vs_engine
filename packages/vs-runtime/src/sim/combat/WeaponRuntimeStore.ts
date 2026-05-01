import type { ContentRegistry } from "../content/ContentRegistry";
import type { PlayerCharacterId, WeaponId } from "../content/ContentIds";
import type { SimContent } from "../core/SimApi";
import type { World } from "../world/World";

export interface WeaponRuntimeStore {
  capacity: number;
  activeCount: number;
  ownerCharacterId: PlayerCharacterId | null;
  weaponTypeIds: Uint16Array;
  weaponLevels: Uint8Array;
  cooldownRemaining: Float32Array;
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
    reset() {
      this.activeCount = 0;
      this.ownerCharacterId = null;
      this.weaponTypeIds.fill(0);
      this.weaponLevels.fill(0);
      this.cooldownRemaining.fill(0);
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
