import type { PlayerRenderSnapshot } from "../../sim/core/RenderSnapshot.ts";
export interface PlayerViewModel {
    key: string;
    visible: boolean;
    spriteKey: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
}
export declare function presentPlayer(snapshot: PlayerRenderSnapshot): PlayerViewModel;
//# sourceMappingURL=PlayerPresenter.d.ts.map