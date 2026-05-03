import { type PositionedViewModel } from "./RenderPool.ts";
export interface ProjectileViewModel extends PositionedViewModel {
    key: string;
    typeId: number;
    spriteKey: string;
    displayName: string;
}
export declare class ProjectileRenderPool {
    private readonly pool;
    sync(activeCount: number): void;
    getItems(): readonly ProjectileViewModel[];
}
//# sourceMappingURL=ProjectileRenderPool.d.ts.map