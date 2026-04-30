import type { FrameContext } from "../core/FrameContext";
import { getEnemyArchetypeByIndex } from "./EnemyArchetypeRuntime";
import { ensureEnemyStore } from "./EnemyStore";

export function applyEnemySpawnCommands(context: FrameContext): void {
  const { world } = context;
  const store = ensureEnemyStore(world);
  const commandCount = world.commands.enemySpawn.count;

  for (let commandIndex = 0; commandIndex < commandCount; commandIndex += 1) {
    const command = world.commands.enemySpawn.get(commandIndex);
    const archetype = getEnemyArchetypeByIndex(world.content, command.archetypeId);
    if (!archetype) {
      continue;
    }

    const slot = store.allocate();
    store.typeIds[slot] = archetype.contentIndex;
    store.posX[slot] = command.x;
    store.posY[slot] = command.y;
    store.velX[slot] = 0;
    store.velY[slot] = 0;
    store.radius[slot] = archetype.radius;
    store.hp[slot] = archetype.maxHp;
    store.maxHp[slot] = archetype.maxHp;
    store.moveSpeed[slot] = archetype.moveSpeed;
    store.contactDamage[slot] = archetype.contactDamage;
    store.xpValue[slot] = archetype.xpValue;
    store.flags[slot] = archetype.collisionFlags;
  }

  world.commands.enemySpawn.clear();
}
