import { progressionCurveId } from "../ContentIds";
import type { ProgressionCurveDef } from "../ContentTypes";

export const prototypeProgressionCurves: readonly ProgressionCurveDef[] = [
  {
    id: progressionCurveId("progression.prototype"),
    displayName: "Prototype Progression",
    levelXpThresholds: [5, 12, 20, 30, 42, 56, 72, 90, 110, 132],
  },
];
