import type { DebugSnapshot } from "../debug/DebugSnapshot";
import type { LevelUpPayload } from "../progression/UpgradeChoice";
import type { RenderSnapshot } from "./RenderSnapshot";
import type { RunState } from "./RunState";
import type { SimConfig } from "./SimConfig";
import type { SimInput } from "./SimInput";

export interface SimContentLike {
  readonly __simContentBrand__?: never;
}

export interface SimConfigLike {
  readonly fixedStepSeconds: number;
  readonly [key: string]: unknown;
}

export interface SimContent extends SimContentLike {
  readonly enemyArchetypes?: unknown;
  readonly weapons?: unknown;
  readonly projectiles?: unknown;
  readonly passiveUpgrades?: unknown;
  readonly pickups?: unknown;
  readonly playerCharacters?: unknown;
  readonly progressionCurves?: unknown;
  readonly waves?: unknown;
}

export interface CreateSimArgs<
  TContent extends SimContentLike = SimContent,
  TConfig extends SimConfigLike = SimConfigLike,
> {
  readonly content: TContent;
  readonly config: TConfig;
  readonly seed: number;
}

export interface TestableSimLike {
  step(frameSeconds: number, inputFrame: Readonly<SimInput>): unknown;
  readonly fixedStepSeconds?: number;
  getFixedStepSeconds?(): number;
}

export type SimFactory<
  TSim extends TestableSimLike,
  TContent extends SimContentLike = SimContent,
  TConfig extends SimConfigLike = SimConfigLike,
> = (args: CreateSimArgs<TContent, TConfig>) => TSim;

export interface SimApi {
  readonly config: Readonly<SimConfig>;
  step(frameSeconds: number, inputFrame?: Readonly<SimInput>): number;
  resetRun(seed?: number): void;
  setRunState(nextState: RunState): void;
  getRenderSnapshot(): RenderSnapshot;
  getDebugSnapshot(): DebugSnapshot;
  getLevelUpPayload(): LevelUpPayload | null;
  ensureLevelUpPayload(): LevelUpPayload | null;
  selectUpgrade(choiceIndex: number): boolean;
}
