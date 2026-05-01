import type {
  EnemyArchetypeId,
  PassiveUpgradeId,
  PickupId,
  PlayerCharacterId,
  ProgressionCurveId,
  ProjectileId,
  WaveId,
  WeaponId,
} from "./ContentIds";
import type {
  ContentBundle,
  EnemyArchetypeDef,
  PassiveUpgradeDef,
  PickupDef,
  PlayerCharacterDef,
  ProgressionCurveDef,
  ProjectileDef,
  WaveDef,
  WeaponDef,
} from "./ContentTypes";

export interface ContentTable<TId extends string, TDef extends { id: TId }> {
  readonly ids: readonly TId[];
  readonly defs: readonly TDef[];
  readonly byId: ReadonlyMap<TId, TDef>;
  readonly indexById: ReadonlyMap<TId, number>;
  get(id: TId): TDef;
  getIndex(id: TId): number;
  has(id: TId): boolean;
}

export interface ContentRegistry {
  readonly playerCharacters: ContentTable<PlayerCharacterId, PlayerCharacterDef>;
  readonly enemyArchetypes: ContentTable<EnemyArchetypeId, EnemyArchetypeDef>;
  readonly weapons: ContentTable<WeaponId, WeaponDef>;
  readonly projectiles: ContentTable<ProjectileId, ProjectileDef>;
  readonly passiveUpgrades: ContentTable<PassiveUpgradeId, PassiveUpgradeDef>;
  readonly pickups: ContentTable<PickupId, PickupDef>;
  readonly progressionCurves: ContentTable<
    ProgressionCurveId,
    ProgressionCurveDef
  >;
  readonly waves: ContentTable<WaveId, WaveDef>;
  readonly bundle: Readonly<ContentBundle>;
}

class ContentTableImpl<TId extends string, TDef extends { id: TId }>
  implements ContentTable<TId, TDef>
{
  public readonly ids: readonly TId[];
  public readonly defs: readonly TDef[];
  public readonly byId: ReadonlyMap<TId, TDef>;
  public readonly indexById: ReadonlyMap<TId, number>;

  public constructor(defs: readonly TDef[]) {
    this.defs = defs;
    this.ids = defs.map((def) => def.id);
    this.byId = new Map(defs.map((def) => [def.id, def]));
    this.indexById = new Map(this.ids.map((id, index) => [id, index]));
  }

  public get(id: TId): TDef {
    const def = this.byId.get(id);

    if (!def) {
      throw new Error(`Unknown content ID "${id}".`);
    }

    return def;
  }

  public getIndex(id: TId): number {
    const index = this.indexById.get(id);

    if (index === undefined) {
      throw new Error(`Unknown content ID "${id}".`);
    }

    return index;
  }

  public has(id: TId): boolean {
    return this.byId.has(id);
  }
}

export function createContentRegistry(bundle: ContentBundle): ContentRegistry {
  return {
    playerCharacters: new ContentTableImpl(bundle.playerCharacters),
    enemyArchetypes: new ContentTableImpl(bundle.enemyArchetypes),
    weapons: new ContentTableImpl(bundle.weapons),
    projectiles: new ContentTableImpl(bundle.projectiles),
    passiveUpgrades: new ContentTableImpl(bundle.passiveUpgrades),
    pickups: new ContentTableImpl(bundle.pickups),
    progressionCurves: new ContentTableImpl(bundle.progressionCurves),
    waves: new ContentTableImpl(bundle.waves),
    bundle,
  };
}
