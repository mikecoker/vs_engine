import type { SimInput } from "../core/SimInput.ts";

export type DebugCommand =
  | { type: "grant_xp"; amount: number }
  | { type: "spawn_test_wave"; count: number; archetypeId?: number }
  | { type: "kill_all_enemies" };

export interface DebugCommandFrame {
  readonly grantXp: boolean;
  readonly spawnWave: boolean;
}

export const EMPTY_DEBUG_COMMAND_FRAME: Readonly<DebugCommandFrame> = {
  grantXp: false,
  spawnWave: false,
};

export function extractDebugCommandFrame(input: Readonly<SimInput>): DebugCommandFrame {
  return {
    grantXp: input.debugGrantXpPressed ?? false,
    spawnWave: input.debugSpawnWavePressed ?? false,
  };
}

export class DebugCommandQueue {
  private readonly commands: DebugCommand[] = [];

  public get length(): number {
    return this.commands.length;
  }

  public enqueueGrantXp(amount: number): void {
    this.commands.push({ type: "grant_xp", amount });
  }

  public enqueueSpawnTestWave(count: number, archetypeId?: number): void {
    this.commands.push({ type: "spawn_test_wave", count, archetypeId });
  }

  public enqueueKillAllEnemies(): void {
    this.commands.push({ type: "kill_all_enemies" });
  }

  public drain(): DebugCommand[] {
    const drained = this.commands.slice();
    this.commands.length = 0;
    return drained;
  }
}
