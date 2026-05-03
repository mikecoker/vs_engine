import { ReusableCommandBuffer } from "./ReusableCommandBuffer.ts";

export interface ProjectileSpawnCommand {
  projectileTypeId: number;
  ownerTeam: number;
  x: number;
  y: number;
  velX: number;
  velY: number;
  radius: number;
  damage: number;
  remainingLife: number;
  remainingPierce: number;
  flags: number;
}

export class ProjectileSpawnBuffer extends ReusableCommandBuffer<ProjectileSpawnCommand> {
  constructor() {
    super(() => ({
      projectileTypeId: 0,
      ownerTeam: 0,
      x: 0,
      y: 0,
      velX: 0,
      velY: 0,
      radius: 0,
      damage: 0,
      remainingLife: 0,
      remainingPierce: 0,
      flags: 0,
    }));
  }

  public enqueue(commandInput: Readonly<ProjectileSpawnCommand>): void {
    this.enqueueValues(
      commandInput.projectileTypeId,
      commandInput.ownerTeam,
      commandInput.x,
      commandInput.y,
      commandInput.velX,
      commandInput.velY,
      commandInput.radius,
      commandInput.damage,
      commandInput.remainingLife,
      commandInput.remainingPierce,
      commandInput.flags,
    );
  }

  public enqueueValues(
    projectileTypeId: number,
    ownerTeam: number,
    x: number,
    y: number,
    velX: number,
    velY: number,
    radius: number,
    damage: number,
    remainingLife: number,
    remainingPierce: number,
    flags: number,
  ): void {
    const command = this.nextRecord();
    command.projectileTypeId = projectileTypeId;
    command.ownerTeam = ownerTeam;
    command.x = x;
    command.y = y;
    command.velX = velX;
    command.velY = velY;
    command.radius = radius;
    command.damage = damage;
    command.remainingLife = remainingLife;
    command.remainingPierce = remainingPierce;
    command.flags = flags;
  }
}
