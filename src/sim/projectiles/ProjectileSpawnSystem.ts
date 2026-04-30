import type { FrameContext } from "../core/FrameContext";
import { ensureProjectileStore } from "./ProjectileStore";

export function spawnProjectilesFromCommands(context: FrameContext): void {
  const store = ensureProjectileStore(context.world);
  const commands = context.world.commands.projectileSpawn;
  const commandCount = commands.count;

  for (let index = 0; index < commandCount; index += 1) {
    const command = commands.get(index);
    const slot = store.allocate();
    store.typeIds[slot] = command.projectileTypeId;
    store.ownerTeam[slot] = command.ownerTeam;
    store.posX[slot] = command.x;
    store.posY[slot] = command.y;
    store.velX[slot] = command.velX;
    store.velY[slot] = command.velY;
    store.radius[slot] = command.radius;
    store.damage[slot] = command.damage;
    store.remainingLife[slot] = command.remainingLife;
    store.remainingPierce[slot] = command.remainingPierce;
    store.flags[slot] = command.flags;
  }

  commands.clear();
}

