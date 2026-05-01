import { enemyArchetypeId } from "../ContentIds.ts";
import type { EnemyArchetypeDef } from "../ContentTypes.ts";

export const prototypeEnemyArchetypes: readonly EnemyArchetypeDef[] = [
  {
    id: enemyArchetypeId("enemy.bat"),
    displayName: "Bat",
    spriteKey: "enemy_bat",
    behavior: "chase",
    maxHp: 10,
    moveSpeed: 85,
    radius: 10,
    contactDamage: 8,
    xpValue: 1,
    collisionFlags: 1,
  },
  {
    id: enemyArchetypeId("enemy.skeleton"),
    displayName: "Skeleton",
    spriteKey: "enemy_skeleton",
    behavior: "chase",
    maxHp: 24,
    moveSpeed: 55,
    radius: 14,
    contactDamage: 12,
    xpValue: 2,
    collisionFlags: 1,
  },
  {
    id: enemyArchetypeId("enemy.ghost"),
    displayName: "Ghost",
    spriteKey: "enemy_ghost",
    behavior: "chase",
    maxHp: 18,
    moveSpeed: 70,
    radius: 13,
    contactDamage: 10,
    xpValue: 3,
    collisionFlags: 1,
  },
];
