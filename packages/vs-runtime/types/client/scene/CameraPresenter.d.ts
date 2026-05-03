import type { PlayerRenderSnapshot } from "../../sim/core/RenderSnapshot.ts";
export interface CameraViewModel {
    readonly centerX: number;
    readonly centerY: number;
    readonly zoom: number;
}
export declare function presentCamera(player: PlayerRenderSnapshot, zoom?: number): CameraViewModel;
//# sourceMappingURL=CameraPresenter.d.ts.map