import { type SystemName } from "../../debug/DebugSnapshot.ts";
import type { FrameContext } from "../FrameContext.ts";
export type SystemPhase = "always" | "gameplay";
export interface SimSystem {
    readonly name: SystemName;
    readonly phase: SystemPhase;
    execute(context: FrameContext): void;
}
export declare function createSystemPipeline(): readonly SimSystem[];
//# sourceMappingURL=SystemRegistry.d.ts.map