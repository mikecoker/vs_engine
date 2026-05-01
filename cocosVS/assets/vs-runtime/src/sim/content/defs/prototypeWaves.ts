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
        endSeconds: 30,
        intervalSeconds: 2.5,
        batchSize: 2,
        weight: 3,
        maxConcurrent: 12,
      },
      {
        enemyId: enemyArchetypeId("enemy.skeleton"),
        startSeconds: 20,
        endSeconds: 55,
        intervalSeconds: 4,
        batchSize: 2,
        weight: 2,
        maxConcurrent: 10,
      },
      {
        enemyId: enemyArchetypeId("enemy.ghost"),
        startSeconds: 40,
        endSeconds: 70,
        intervalSeconds: 5,
        batchSize: 1,
        weight: 1,
        maxConcurrent: 6,
      },
    ],
  },
];
