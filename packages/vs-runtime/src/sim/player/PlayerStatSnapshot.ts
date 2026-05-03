export interface PlayerStatSnapshot {
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly armor: number;
  readonly might: number;
  readonly cooldownMultiplier: number;
  readonly durationMultiplier: number;
  readonly areaMultiplier: number;
  readonly projectileCount: number;
  readonly pickupRadius: number;
  readonly luck: number;
  readonly radius: number;
}

export const DEFAULT_PLAYER_STAT_SNAPSHOT: Readonly<PlayerStatSnapshot> = {
  maxHp: 100,
  moveSpeed: 160,
  armor: 0,
  might: 1,
  cooldownMultiplier: 1,
  durationMultiplier: 1,
  areaMultiplier: 1,
  projectileCount: 1,
  pickupRadius: 40,
  luck: 0,
  radius: 12,
};
