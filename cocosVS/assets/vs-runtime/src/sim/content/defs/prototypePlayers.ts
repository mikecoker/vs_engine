import { playerCharacterId, weaponId } from "../ContentIds.ts";
import type { PlayerCharacterDef } from "../ContentTypes.ts";

export const prototypePlayerCharacters: readonly PlayerCharacterDef[] = [
  {
    id: playerCharacterId("player.witch"),
    displayName: "Witch",
    description: "Balanced starter character built around ranged spell fire.",
    spriteKey: "player_witch",
    baseStats: {
      maxHp: 100,
      moveSpeed: 160,
      radius: 12,
      pickupRadius: 96,
      armor: 0,
      might: 1,
      cooldownMultiplier: 1,
      durationMultiplier: 1,
      areaMultiplier: 1,
      projectileCount: 1,
      luck: 0,
    },
    starterWeaponIds: [weaponId("weapon.magic_bolt")],
  },
];
