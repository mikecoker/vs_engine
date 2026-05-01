import type { ContentRegistry } from "../content/ContentRegistry";
import type { WeaponDef } from "../content/ContentTypes";
import type { SimContent } from "../core/SimApi";

export interface WeaponRuntimeDef extends WeaponDef {
  readonly contentIndex: number;
  readonly projectileIndex: number;
}

export interface WeaponRuntimeContent {
  readonly weapons: readonly WeaponRuntimeDef[];
}

const weaponRuntimeCache = new WeakMap<object, WeaponRuntimeContent>();

function isContentRegistry(value: SimContent): value is SimContent & ContentRegistry {
  const registry = value as Partial<ContentRegistry>;
  return (
    typeof value === "object" &&
    value !== null &&
    !!registry.weapons &&
    !!registry.projectiles &&
    Array.isArray(registry.weapons.defs) &&
    Array.isArray(registry.projectiles.defs)
  );
}

function buildWeaponRuntimeContent(content: ContentRegistry): WeaponRuntimeContent {
  return {
    weapons: content.weapons.defs.map((def, contentIndex) => ({
      ...def,
      contentIndex,
      projectileIndex: def.projectileId ? content.projectiles.getIndex(def.projectileId) : -1,
    })),
  };
}

export function getWeaponRuntimeContent(content: SimContent): WeaponRuntimeContent | null {
  if (!isContentRegistry(content)) {
    return null;
  }

  const cacheKey = content as object;
  const cached = weaponRuntimeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const built = buildWeaponRuntimeContent(content);
  weaponRuntimeCache.set(cacheKey, built);
  return built;
}

export function getWeaponDefByIndex(content: SimContent, weaponIndex: number): WeaponRuntimeDef | null {
  const runtime = getWeaponRuntimeContent(content);
  if (!runtime) {
    return null;
  }

  return runtime.weapons[weaponIndex] ?? null;
}

