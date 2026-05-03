export interface PositionedViewModel {
    visible: boolean;
    x: number;
    y: number;
}
export declare class RenderPool<T extends PositionedViewModel> {
    private readonly createItem;
    private readonly items;
    constructor(createItem: () => T);
    syncCount(count: number): void;
    getItems(): readonly T[];
}
//# sourceMappingURL=RenderPool.d.ts.map