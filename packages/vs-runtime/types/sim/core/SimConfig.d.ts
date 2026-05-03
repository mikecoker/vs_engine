import { RunState } from "./RunState.ts";
export interface SimRectBounds {
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
}
export interface SimBoundsConfig {
    readonly player: SimRectBounds;
    readonly spawn: SimRectBounds;
}
export interface SimCapacityConfig {
    readonly enemies: number;
    readonly projectiles: number;
    readonly pickups: number;
    readonly commandBuffer: number;
}
export interface SimConfig {
    readonly fixedStepSeconds: number;
    readonly maxSubstepsPerFrame: number;
    readonly maxFrameSeconds: number;
    readonly initialRunState: RunState;
    readonly bounds?: SimBoundsConfig;
    readonly capacities: SimCapacityConfig;
}
export declare const DEFAULT_SIM_BOUNDS: Readonly<SimBoundsConfig>;
export declare const DEFAULT_SIM_CONFIG: Readonly<SimConfig>;
export declare function mergeSimConfig(overrides?: Partial<SimConfig>): SimConfig;
//# sourceMappingURL=SimConfig.d.ts.map