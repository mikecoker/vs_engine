import { RunState } from "../core/RunState.ts";
import type { DamageCommand, DamageSourceKind } from "../core/commands/DamageBuffer.ts";
import type { FrameContext } from "../core/FrameContext.ts";
import type { PlayerStore } from "./PlayerStore.ts";

export interface PlayerDamageResult {
  readonly applied: boolean;
  readonly amountApplied: number;
  readonly killedPlayer: boolean;
}

function resolveMitigatedDamage(player: Readonly<PlayerStore>, amount: number): number {
  return Math.max(0, amount - player.statSnapshot.armor);
}

export function tickPlayerInvulnerability(player: PlayerStore, dt: number): void {
  if (player.invulnRemaining <= 0) {
    return;
  }

  player.invulnRemaining = Math.max(0, player.invulnRemaining - dt);
}

export function applyDamageToPlayer(
  player: PlayerStore,
  amount: number,
  _sourceKind: DamageSourceKind,
): PlayerDamageResult {
  if (
    !player.exists ||
    player.isDead ||
    amount <= 0 ||
    player.debugInvulnerable ||
    player.invulnRemaining > 0
  ) {
    return { applied: false, amountApplied: 0, killedPlayer: false };
  }

  const amountApplied = resolveMitigatedDamage(player, amount);
  if (amountApplied <= 0) {
    return { applied: false, amountApplied: 0, killedPlayer: false };
  }

  player.hp = Math.max(0, player.hp - amountApplied);
  player.invulnRemaining = player.invulnerabilityDurationSeconds;

  if (player.hp > 0) {
    return { applied: true, amountApplied, killedPlayer: false };
  }

  player.isDead = true;
  player.velX = 0;
  player.velY = 0;
  return { applied: true, amountApplied, killedPlayer: true };
}

function copyDamageCommand(target: DamageCommand, source: DamageCommand): void {
  target.targetKind = source.targetKind;
  target.targetId = source.targetId;
  target.amount = source.amount;
  target.sourceKind = source.sourceKind;
  target.sourceId = source.sourceId;
}

export function stepPlayerDamageSystem(context: FrameContext): void {
  const { dt, world } = context;
  const player = world.stores.player;
  const damageBuffer = world.commands.damage;

  tickPlayerInvulnerability(player, dt);

  let nextWriteIndex = 0;
  const originalCount = damageBuffer.count;
  for (let readIndex = 0; readIndex < originalCount; readIndex += 1) {
    const command = damageBuffer.get(readIndex);
    if (command.targetKind === "player") {
      const result = applyDamageToPlayer(player, command.amount, command.sourceKind);
      if (result.killedPlayer) {
        world.commands.stateChange.enqueue(RunState.GameOver, "player-death");
      }
      continue;
    }

    if (nextWriteIndex !== readIndex) {
      copyDamageCommand(damageBuffer.get(nextWriteIndex), command);
    }
    nextWriteIndex += 1;
  }

  damageBuffer.count = nextWriteIndex;
}
