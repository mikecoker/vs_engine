import type { DebugSnapshot } from "../debug/DebugSnapshot.ts";
import type { RenderSnapshot } from "./RenderSnapshot.ts";
import { RunState } from "./RunState.ts";
import { type SimConfig } from "./SimConfig.ts";
import { type SimInput } from "./SimInput.ts";
import type { SimApi, SimContent } from "./SimApi.ts";
export declare class Sim implements SimApi {
    readonly config: Readonly<SimConfig>;
    get fixedStepSeconds(): number;
    private readonly content;
    private readonly pipeline;
    private readonly worldFactory;
    private accumulatorSeconds;
    private seed;
    private world;
    constructor(config?: Partial<SimConfig>, content?: SimContent, seed?: number);
    step(frameSeconds: number, inputFrame?: Readonly<SimInput>): number;
    resetRun(seed?: number): void;
    setRunState(nextState: RunState): void;
    getRenderSnapshot(): RenderSnapshot;
    getFixedStepSeconds(): number;
    getLevelUpPayload(): import("../progression/UpgradeChoice.ts").LevelUpPayload | null;
    ensureLevelUpPayload(): import("../progression/UpgradeChoice.ts").LevelUpPayload | null;
    selectUpgrade(choiceIndex: number): boolean;
    getDebugSnapshot(): DebugSnapshot;
    private executeTick;
}
export declare function createSim(config?: Partial<SimConfig>, content?: SimContent, seed?: number): Sim;
//# sourceMappingURL=Sim.d.ts.map