import type { ContentRegistry } from "../content/ContentRegistry";
import type { ProgressionCurveDef } from "../content/ContentTypes";
import type { SimContent } from "../core/SimApi";

function isContentRegistry(content: SimContent): content is SimContent & ContentRegistry {
  const registry = content as Partial<ContentRegistry>;
  return (
    typeof content === "object" &&
    content !== null &&
    !!registry.progressionCurves &&
    Array.isArray(registry.progressionCurves.defs)
  );
}

export function resolveActiveProgressionCurve(
  content: SimContent,
): { curve: ProgressionCurveDef; curveIndex: number } | null {
  if (!isContentRegistry(content)) {
    return null;
  }

  const waveDef = content.waves.defs[0];
  if (waveDef) {
    const curveIndex = content.progressionCurves.getIndex(waveDef.progressionCurveId);
    return {
      curve: content.progressionCurves.defs[curveIndex],
      curveIndex,
    };
  }

  const curve = content.progressionCurves.defs[0];
  if (!curve) {
    return null;
  }

  return {
    curve,
    curveIndex: 0,
  };
}

export function getXpThresholdForLevel(
  curve: Readonly<ProgressionCurveDef> | null,
  level: number,
): number {
  const nextLevelIndex = Math.max(0, level - 1);
  if (!curve || curve.levelXpThresholds.length === 0) {
    return 5;
  }

  if (nextLevelIndex < curve.levelXpThresholds.length) {
    return Math.max(1, curve.levelXpThresholds[nextLevelIndex] ?? 1);
  }

  const lastIndex = curve.levelXpThresholds.length - 1;
  const lastThreshold = curve.levelXpThresholds[lastIndex] ?? 1;
  const previousThreshold = curve.levelXpThresholds[lastIndex - 1] ?? lastThreshold;
  const step = Math.max(1, lastThreshold - previousThreshold);
  return lastThreshold + step * (nextLevelIndex - lastIndex);
}
