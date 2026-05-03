import type { RenderSnapshot } from "../../sim/core/RenderSnapshot.ts";
import type { ClientContentCatalog } from "../content/ClientContentCatalog.ts";
export interface WeaponEffectViewModel {
    readonly key: string;
    readonly behavior: "aura" | "nova";
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly alpha: number;
    readonly visible: boolean;
}
export declare function presentWeaponEffects(snapshot: RenderSnapshot, content: ClientContentCatalog): readonly WeaponEffectViewModel[];
//# sourceMappingURL=WeaponEffectPresenter.d.ts.map