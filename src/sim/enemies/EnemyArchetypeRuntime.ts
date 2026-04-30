import type { ContentRegistry } from "../content/ContentRegistry";
import type { EnemyArchetypeDef, WaveDef, WaveSpawnEntryDef } from "../content/ContentTypes";
import type { SimContent } from "../core/SimApi";

export interface EnemyArchetypeRuntimeDef extends EnemyArchetypeDef {
  readonly contentIndex: number;
}

export interface EnemyWaveSpawnRuntimeEntry extends WaveSpawnEntryDef {
  readonly enemyIndex: number;
}

export interface EnemyWaveRuntimeDef extends WaveDef {
  readonly contentIndex: number;
  readonly spawnEntries: readonly EnemyWaveSpawnRuntimeEntry[];
}

export interface EnemyRuntimeContent {
  readonly archetypes: readonly EnemyArchetypeRuntimeDef[];
  readonly waves: readonly EnemyWaveRuntimeDef[];
}

const enemyRuntimeCache = new WeakMap<object, EnemyRuntimeContent>();

function isContentRegistry(value: SimContent): value is SimContent & ContentRegistry {
  const registry = value as Partial<ContentRegistry>;
  return (
    typeof value === "object" &&
    value !== null &&
    !!registry.enemyArchetypes &&
    !!registry.waves &&
    Array.isArray(registry.enemyArchetypes.ids) &&
    Array.isArray(registry.waves.ids)
  );
}

function buildEnemyRuntimeContent(content: ContentRegistry): EnemyRuntimeContent {
  const archetypes = content.enemyArchetypes.defs.map((def, contentIndex) => ({
    ...def,
    contentIndex,
  }));

  const waves = content.waves.defs.map((wave, contentIndex) => ({
    ...wave,
    contentIndex,
    spawnEntries: wave.spawnEntries.map((entry) => ({
      ...entry,
      enemyIndex: content.enemyArchetypes.getIndex(entry.enemyId),
    })),
  }));

  return { archetypes, waves };
}

export function getEnemyRuntimeContent(content: SimContent): EnemyRuntimeContent | null {
  if (!isContentRegistry(content)) {
    return null;
  }

  const cacheKey = content as object;
  const cached = enemyRuntimeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const built = buildEnemyRuntimeContent(content);
  enemyRuntimeCache.set(cacheKey, built);
  return built;
}

export function getEnemyArchetypeByIndex(
  content: SimContent,
  archetypeIndex: number,
): EnemyArchetypeRuntimeDef | null {
  const runtime = getEnemyRuntimeContent(content);
  if (!runtime) {
    return null;
  }

  return runtime.archetypes[archetypeIndex] ?? null;
}

export function getDefaultEnemyWave(content: SimContent): EnemyWaveRuntimeDef | null {
  const runtime = getEnemyRuntimeContent(content);
  if (!runtime || runtime.waves.length === 0) {
    return null;
  }

  return runtime.waves[0];
}
