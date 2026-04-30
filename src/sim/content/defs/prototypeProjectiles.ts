import { projectileId } from "../ContentIds";
import type { ProjectileDef } from "../ContentTypes";

export const prototypeProjectiles: readonly ProjectileDef[] = [
  {
    id: projectileId("projectile.magic_bolt"),
    displayName: "Magic Bolt",
    spriteKey: "projectile_magic_bolt",
    radius: 6,
    speed: 340,
    baseDamage: 12,
    lifetimeSeconds: 1.4,
    maxPierce: 0,
    collisionFlags: 1,
  },
];
