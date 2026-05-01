import type { SimInput } from "../../sim/core/SimInput";
import type { ClientInputSource } from "./ClientInputSource";

export interface CocosInputSource extends ClientInputSource {}

function clampAxis(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(-1, Math.min(1, value ?? 0));
}

export function normalizeMovementAxes(
  moveX: number | undefined,
  moveY: number | undefined,
): { moveX: number; moveY: number } {
  const clampedX = clampAxis(moveX);
  const clampedY = clampAxis(moveY);
  const magnitude = Math.hypot(clampedX, clampedY);
  if (magnitude <= 1) {
    return {
      moveX: clampedX,
      moveY: clampedY,
    };
  }

  return {
    moveX: clampedX / magnitude,
    moveY: clampedY / magnitude,
  };
}

export function adaptCocosInput(source: Readonly<CocosInputSource>): SimInput {
  const movement = normalizeMovementAxes(source.moveX, source.moveY);

  return {
    moveX: movement.moveX,
    moveY: movement.moveY,
    pausePressed: source.pausePressed ?? false,
    confirmPressed: source.confirmPressed ?? false,
    cancelPressed: source.cancelPressed ?? false,
    debugGrantXpPressed: source.debugGrantXpPressed ?? false,
    debugSpawnWavePressed: source.debugSpawnWavePressed ?? false,
  };
}
