import { projectileId } from "../ContentIds.ts";
import type { ProjectileDef } from "../ContentTypes.ts";

export const prototypeProjectiles: readonly ProjectileDef[] = [
  {
    id: projectileId("projectile.magic_bolt"),
    displayName: "Magic Bolt",
    spriteKey: "projectile_magic_bolt",
    radius: 6,
    speed: 520,
    baseDamage: 12,
    lifetimeSeconds: 1.4,
    maxPierce: 0,
    collisionFlags: 1,
  },
];
