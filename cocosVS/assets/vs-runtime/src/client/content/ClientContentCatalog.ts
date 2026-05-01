import type { ContentRegistry } from "../../sim/content/ContentRegistry.ts";
import type { SimContent } from "../../sim/core/SimApi.ts";

export interface EntityVisualDef {
  readonly spriteKey: string;
  readonly displayName: string;
}

export interface UpgradeVisualDef {
  readonly iconKey: string;
  readonly displayName: string;
  readonly description: string;
}

export interface ClientContentCatalog {
  readonly enemies: readonly EntityVisualDef[];
  readonly projectiles: readonly EntityVisualDef[];
  readonly pickups: readonly EntityVisualDef[];
  readonly weapons: readonly UpgradeVisualDef[];
  readonly passives: readonly UpgradeVisualDef[];
}

const EMPTY_CATALOG: ClientContentCatalog = {
  enemies: [],
  projectiles: [],
  pickups: [],
  weapons: [],
  passives: [],
};

function isContentRegistry(content: SimContent): content is SimContent & ContentRegistry {
  const registry = content as Partial<ContentRegistry>;
  return (
    typeof content === "object" &&
    content !== null &&
    !!registry.enemyArchetypes &&
    !!registry.projectiles &&
    !!registry.pickups &&
    Array.isArray(registry.enemyArchetypes.defs) &&
    Array.isArray(registry.projectiles.defs) &&
    Array.isArray(registry.pickups.defs)
  );
}

export function createClientContentCatalog(content: SimContent): ClientContentCatalog {
  if (!isContentRegistry(content)) {
    return EMPTY_CATALOG;
  }

  return {
    enemies: content.enemyArchetypes.defs.map((def) => ({
      spriteKey: def.spriteKey,
      displayName: def.displayName,
    })),
    projectiles: content.projectiles.defs.map((def) => ({
      spriteKey: def.spriteKey,
      displayName: def.displayName,
    })),
    pickups: content.pickups.defs.map((def) => ({
      spriteKey: def.spriteKey,
      displayName: def.displayName,
    })),
    weapons: content.weapons.defs.map((def) => ({
      iconKey: def.iconKey,
      displayName: def.displayName,
      description: def.description,
    })),
    passives: content.passiveUpgrades.defs.map((def) => ({
      iconKey: def.iconKey,
      displayName: def.displayName,
      description: def.description,
    })),
  };
}
