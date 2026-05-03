import { type PositionedViewModel } from "./RenderPool.ts";
export interface PickupViewModel extends PositionedViewModel {
    key: string;
    typeId: number;
    spriteKey: string;
    displayName: string;
    grantKind: "xp" | "heal" | "magnet";
    tintColor?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    visualScale: number;
}
export declare const HEAL_PICKUP_TINT: {
    readonly r: 255;
    readonly g: 120;
    readonly b: 210;
    readonly a: 255;
};
export declare const MAGNET_PICKUP_TINT: {
    readonly r: 120;
    readonly g: 190;
    readonly b: 255;
    readonly a: 255;
};
export declare class PickupRenderPool {
    private readonly pool;
    sync(activeCount: number): void;
    getItems(): readonly PickupViewModel[];
}
//# sourceMappingURL=PickupRenderPool.d.ts.map