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
        endSeconds: 600,
        intervalSeconds: 2.75,
        batchSize: 4,
        weight: 3,
        maxConcurrent: 20,
      },
      {
        enemyId: enemyArchetypeId("enemy.skeleton"),
        startSeconds: 20,
        endSeconds: 600,
        intervalSeconds: 4.5,
        batchSize: 3,
        weight: 2,
        maxConcurrent: 16,
      },
      {
        enemyId: enemyArchetypeId("enemy.ghost"),
        startSeconds: 40,
        endSeconds: 600,
        intervalSeconds: 5.5,
        batchSize: 2,
        weight: 1,
        maxConcurrent: 10,
      },
      {
        enemyId: enemyArchetypeId("enemy.miniboss_executioner"),
        startSeconds: 75,
        endSeconds: 600,
        intervalSeconds: 45,
        batchSize: 1,
        weight: 0.4,
        maxConcurrent: 2,
      },
      {
        enemyId: enemyArchetypeId("enemy.boss_lich"),
        startSeconds: 180,
        endSeconds: 600,
        intervalSeconds: 120,
        batchSize: 1,
        weight: 0.15,
        maxConcurrent: 1,
      },
    ],
  },
];
