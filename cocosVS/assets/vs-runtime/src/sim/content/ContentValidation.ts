import type { AnyContentId } from "./ContentIds.ts";
import type {
  ContentBundle,
  ContentCollectionName,
  PassiveUpgradeDef,
  PlayerCharacterDef,
  WeaponDef,
} from "./ContentTypes.ts";

export interface ContentValidationIssue {
  readonly collection: ContentCollectionName;
  readonly id: string;
  readonly message: string;
}

export class ContentValidationError extends Error {
  public readonly issues: readonly ContentValidationIssue[];

  public constructor(issues: readonly ContentValidationIssue[]) {
    super(formatContentValidationIssues(issues));
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

export function validateContentBundle(bundle: ContentBundle): void {
  const issues: ContentValidationIssue[] = [];

  for (const [collection, defs] of Object.entries(bundle) as [
    ContentCollectionName,
    readonly { id: string }[],
  ][]) {
    const seenIds = new Set<string>();

    for (const def of defs) {
      if (seenIds.has(def.id)) {
        issues.push({
          collection,
          id: def.id,
          message: `Duplicate content ID "${def.id}".`,
        });
      } else {
        seenIds.add(def.id);
      }
    }
  }

  const playerIds = new Set(bundle.playerCharacters.map((def) => def.id));
  const enemyIds = new Set(bundle.enemyArchetypes.map((def) => def.id));
  const weaponIds = new Set(bundle.weapons.map((def) => def.id));
  const projectileIds = new Set(bundle.projectiles.map((def) => def.id));
  const pickupIds = new Set(bundle.pickups.map((def) => def.id));
  const progressionCurveIds = new Set(
    bundle.progressionCurves.map((def) => def.id),
  );

  for (const def of bundle.playerCharacters) {
    validatePlayerCharacterRefs(def, weaponIds, issues);
  }

  for (const def of bundle.weapons) {
    validateWeaponRefs(def, projectileIds, issues);
  }

  for (const def of bundle.passiveUpgrades) {
    validatePassiveUpgradeDef(def, issues);
  }

  for (const def of bundle.waves) {
    if (!progressionCurveIds.has(def.progressionCurveId)) {
      issues.push({
        collection: "waves",
        id: def.id,
        message: `Unknown progression curve "${def.progressionCurveId}".`,
      });
    }

    for (const entry of def.spawnEntries) {
      if (!enemyIds.has(entry.enemyId)) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Unknown enemy archetype "${entry.enemyId}" in spawn entry.`,
        });
      }

      if (entry.endSeconds <= entry.startSeconds) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must end after it starts.`,
        });
      }

      if (entry.intervalSeconds <= 0) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must use a positive interval.`,
        });
      }

      if (entry.batchSize <= 0) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must use a positive batch size.`,
        });
      }

      if (entry.weight <= 0) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must use a positive weight.`,
        });
      }
    }
  }

  if (bundle.playerCharacters.length === 0) {
    issues.push({
      collection: "playerCharacters",
      id: "player.<missing>",
      message: "At least one player character definition is required.",
    });
  }

  if (bundle.enemyArchetypes.length === 0) {
    issues.push({
      collection: "enemyArchetypes",
      id: "enemy.<missing>",
      message: "At least one enemy archetype definition is required.",
    });
  }

  if (bundle.weapons.length === 0) {
    issues.push({
      collection: "weapons",
      id: "weapon.<missing>",
      message: "At least one weapon definition is required.",
    });
  }

  if (bundle.projectiles.length === 0) {
    issues.push({
      collection: "projectiles",
      id: "projectile.<missing>",
      message: "At least one projectile definition is required.",
    });
  }

  if (bundle.pickups.length === 0 || !pickupIds.has("pickup.xp_small")) {
    issues.push({
      collection: "pickups",
      id: "pickup.xp_small",
      message: 'Prototype content must include the "pickup.xp_small" pickup.',
    });
  }

  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }

  void playerIds;
}

function validatePlayerCharacterRefs(
  def: PlayerCharacterDef,
  weaponIds: ReadonlySet<string>,
  issues: ContentValidationIssue[],
): void {
  if (def.starterWeaponIds.length === 0) {
    issues.push({
      collection: "playerCharacters",
      id: def.id,
      message: "Player characters must define at least one starter weapon.",
    });
  }

  for (const starterWeaponId of def.starterWeaponIds) {
    if (!weaponIds.has(starterWeaponId)) {
      issues.push({
        collection: "playerCharacters",
        id: def.id,
        message: `Unknown starter weapon "${starterWeaponId}".`,
      });
    }
  }
}

function validateWeaponRefs(
  def: WeaponDef,
  projectileIds: ReadonlySet<string>,
  issues: ContentValidationIssue[],
): void {
  if (def.behavior === "projectile") {
    if (def.projectileId === null) {
      issues.push({
        collection: "weapons",
        id: def.id,
        message: "Projectile weapons must define a projectileId.",
      });
    } else if (!projectileIds.has(def.projectileId)) {
      issues.push({
        collection: "weapons",
        id: def.id,
        message: `Unknown projectile "${def.projectileId}".`,
      });
    }
  }

  if (def.behavior !== "projectile" && def.projectileId !== null) {
    issues.push({
      collection: "weapons",
      id: def.id,
      message: "Non-projectile weapons must leave projectileId as null.",
    });
  }
}

function validatePassiveUpgradeDef(
  def: PassiveUpgradeDef,
  issues: ContentValidationIssue[],
): void {
  if (def.modifiersByLevel.length !== def.maxLevel) {
    issues.push({
      collection: "passiveUpgrades",
      id: def.id,
      message:
        "Passive upgrade maxLevel must match the number of modifier levels.",
    });
  }
}

export function assertKnownContentId<TId extends AnyContentId>(
  ids: ReadonlySet<string>,
  collection: ContentCollectionName,
  ownerId: string,
  referencedId: TId,
): void {
  if (!ids.has(referencedId)) {
    throw new ContentValidationError([
      {
        collection,
        id: ownerId,
        message: `Unknown content reference "${referencedId}".`,
      },
    ]);
  }
}

function formatContentValidationIssues(
  issues: readonly ContentValidationIssue[],
): string {
  return issues
    .map((issue) => `[${issue.collection}] ${issue.id}: ${issue.message}`)
    .join("\n");
}
