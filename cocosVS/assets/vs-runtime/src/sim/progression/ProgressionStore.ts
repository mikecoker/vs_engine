import type { World } from "../world/World.ts";
import { getXpThresholdForLevel, resolveActiveProgressionCurve } from "./LevelCurve.ts";
import type { UpgradeChoice } from "./UpgradeChoice.ts";

export interface ProgressionStore {
  level: number;
  xp: number;
  xpToNext: number;
  queuedLevelUps: number;
  currentChoices: UpgradeChoice[];
  activeCurveIndex: number;
  passiveUpgradeLevels: Uint8Array;
  initialized: boolean;
  lastResetTick: number;
}

export function createProgressionStore(passiveUpgradeCount = 0): ProgressionStore {
  return {
    level: 1,
    xp: 0,
    xpToNext: 5,
    queuedLevelUps: 0,
    currentChoices: [],
    activeCurveIndex: -1,
    passiveUpgradeLevels: new Uint8Array(passiveUpgradeCount),
    initialized: false,
    lastResetTick: -1,
  };
}

export function resolvePassiveUpgradeCount(
  content: Pick<World, "content">["content"],
): number {
  const defs = content.passiveUpgrades;
  return defs && Array.isArray((defs as { defs?: unknown }).defs)
    ? ((defs as { defs: readonly unknown[] }).defs.length ?? 0)
    : 0;
}

function createPassiveLevelBuffer(world: World): Uint8Array {
  return new Uint8Array(resolvePassiveUpgradeCount(world.content));
}

function clearChoices(store: ProgressionStore): void {
  store.currentChoices.length = 0;
}

function resetProgressionState(world: World, store: ProgressionStore): void {
  const curveInfo = resolveActiveProgressionCurve(world.content);

  store.level = 1;
  store.xp = 0;
  store.queuedLevelUps = 0;
  store.activeCurveIndex = curveInfo?.curveIndex ?? -1;
  store.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, 1);
  store.passiveUpgradeLevels.fill(0);
  clearChoices(store);
  store.initialized = true;
  store.lastResetTick = world.time.tick;
}

export function ensureProgressionStore(world: World): ProgressionStore {
  const base = world.stores.progression as unknown as Partial<ProgressionStore>;
  const expectedPassiveCount = createPassiveLevelBuffer(world).length;

  if (!base.currentChoices) {
    base.currentChoices = [];
  }

  if (!base.passiveUpgradeLevels) {
    base.passiveUpgradeLevels = new Uint8Array(expectedPassiveCount);
  } else if (base.passiveUpgradeLevels.length !== expectedPassiveCount) {
    base.passiveUpgradeLevels = new Uint8Array(expectedPassiveCount);
  }

  if (typeof base.activeCurveIndex !== "number") {
    base.activeCurveIndex = -1;
  }

  if (typeof base.lastResetTick !== "number") {
    base.lastResetTick = -1;
  }

  if (!base.initialized || (world.time.tick === 0 && base.lastResetTick !== 0)) {
    resetProgressionState(world, base as ProgressionStore);
  } else {
    const curveInfo = resolveActiveProgressionCurve(world.content);
    base.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, base.level ?? 1);
    base.activeCurveIndex = curveInfo?.curveIndex ?? -1;
  }

  return base as ProgressionStore;
}

export function clearUpgradeChoices(store: ProgressionStore): void {
  store.currentChoices.length = 0;
}
