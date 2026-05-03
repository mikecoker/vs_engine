import type { ProgressionCurveDef } from "../content/ContentTypes.ts";
import type { SimContent } from "../core/SimApi.ts";
export declare function resolveActiveProgressionCurve(content: SimContent): {
    curve: ProgressionCurveDef;
    curveIndex: number;
} | null;
export declare function getXpThresholdForLevel(curve: Readonly<ProgressionCurveDef> | null, level: number): number;
//# sourceMappingURL=LevelCurve.d.ts.map