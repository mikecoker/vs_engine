import type { FrameContext } from "../core/FrameContext.ts";
import type { PlayerStore } from "./PlayerStore.ts";

export interface NormalizedMovementVector {
  readonly x: number;
  readonly y: number;
  readonly magnitude: number;
}

export function normalizeMovementInput(moveX: number, moveY: number): NormalizedMovementVector {
  const magnitude = Math.hypot(moveX, moveY);
  if (magnitude <= 0) {
    return { x: 0, y: 0, magnitude: 0 };
  }

  return {
    x: moveX / magnitude,
    y: moveY / magnitude,
    magnitude: 1,
  };
}

export function stepPlayerMovement(context: FrameContext): void {
  const { frameInput, dt, world } = context;
  const player = world.stores.player;

  if (!player.exists || player.isDead) {
    player.velX = 0;
    player.velY = 0;
    return;
  }

  const direction = normalizeMovementInput(frameInput.moveX, frameInput.moveY);
  const speed = player.statSnapshot.moveSpeed;

  player.velX = direction.x * speed;
  player.velY = direction.y * speed;
  player.posX += player.velX * dt;
  player.posY += player.velY * dt;

  if (direction.magnitude > 0) {
    player.facingX = direction.x;
    player.facingY = direction.y;
  }
}

export function getPlayerMoveSpeed(player: Readonly<PlayerStore>): number {
  return player.statSnapshot.moveSpeed;
}
