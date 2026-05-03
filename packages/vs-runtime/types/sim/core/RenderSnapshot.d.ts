import type { RunState } from "./RunState.ts";
export interface PlayerRenderSnapshot {
    readonly exists: boolean;
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly hp: number;
    readonly maxHp: number;
}
export interface EntityRenderSnapshot {
    readonly activeCount: number;
    readonly typeIds: Uint16Array;
    readonly posX: Float32Array;
    readonly posY: Float32Array;
}
export interface ProgressionRenderSnapshot {
    readonly level: number;
    readonly xp: number;
    readonly xpToNext: number;
    readonly queuedLevelUps: number;
}
export interface WeaponRenderSnapshot {
    readonly activeCount: number;
    readonly typeIds: Uint16Array;
    readonly levels: Uint8Array;
    readonly cooldownRemaining: Float32Array;
    readonly lastFireElapsedSeconds: Float32Array;
}
export interface RenderSnapshot {
    readonly runState: RunState;
    readonly elapsedSeconds: number;
    readonly player: PlayerRenderSnapshot;
    readonly enemies: EntityRenderSnapshot;
    readonly projectiles: EntityRenderSnapshot;
    readonly pickups: EntityRenderSnapshot;
    readonly progression: ProgressionRenderSnapshot;
    readonly weapons: WeaponRenderSnapshot;
}
export declare const EMPTY_ENTITY_RENDER_SNAPSHOT: Readonly<EntityRenderSnapshot>;
//# sourceMappingURL=RenderSnapshot.d.ts.map