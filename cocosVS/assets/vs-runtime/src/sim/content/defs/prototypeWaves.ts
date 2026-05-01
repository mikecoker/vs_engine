import { enemyArchetypeId, progressionCurveId, waveId } from "../ContentIds.ts";
import type { WaveDef } from "../ContentTypes.ts";

export const prototypeWaves: readonly WaveDef[] = [
  {
    id: waveId("wave.prototype_field"),
    displayName: "Prototype Field",
    progressionCurveId: progressionCurveId("progression.prototype"),
    spawnEntries: [
      {
        enemyId: enemyArchetypeId("enemy.bat"),
        startSeconds: 0,
        endSeconds: 20,
        intervalSeconds: 1.5,
        batchSize: 4,
        weight: 3,
        maxConcurrent: 40,
      },
      {
        enemyId: enemyArchetypeId("enemy.skeleton"),
        startSeconds: 12,
        endSeconds: 45,
        intervalSeconds: 2.25,
        batchSize: 3,
        weight: 2,
        maxConcurrent: 35,
      },
      {
        enemyId: enemyArchetypeId("enemy.ghost"),
        startSeconds: 24,
        endSeconds: 60,
        intervalSeconds: 2.75,
        batchSize: 2,
        weight: 1,
        maxConcurrent: 25,
      },
    ],
  },
];
