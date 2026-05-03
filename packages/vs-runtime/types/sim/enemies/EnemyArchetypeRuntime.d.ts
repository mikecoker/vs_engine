import type { EnemyArchetypeDef, WaveDef, WaveSpawnEntryDef } from "../content/ContentTypes.ts";
import type { SimContent } from "../core/SimApi.ts";
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
export declare function getEnemyRuntimeContent(content: SimContent): EnemyRuntimeContent | null;
export declare function getEnemyArchetypeByIndex(content: SimContent, archetypeIndex: number): EnemyArchetypeRuntimeDef | null;
export declare function getDefaultEnemyWave(content: SimContent): EnemyWaveRuntimeDef | null;
//# sourceMappingURL=EnemyArchetypeRuntime.d.ts.map