export const PLAYER_TEAM = 1;
export const ENEMY_TEAM = 2;

export function clampDamageAmount(amount: number): number {
  return amount > 0 ? amount : 0;
}

export function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const radiusSum = ar + br;
  return dx * dx + dy * dy <= radiusSum * radiusSum;
}

