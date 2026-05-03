import { type PositionedViewModel } from "./RenderPool.ts";
export interface EnemyViewModel extends PositionedViewModel {
    key: string;
    typeId: number;
    spriteKey: string;
    displayName: string;
    visualScale: number;
}
export declare class EnemyRenderPool {
    private readonly pool;
    sync(activeCount: number): void;
    getItems(): readonly EnemyViewModel[];
}
//# sourceMappingURL=EnemyRenderPool.d.ts.map