import type { SimContent } from "../../sim/core/SimApi.ts";
import type { RenderSnapshot } from "../../sim/core/RenderSnapshot.ts";
import { type EnemyViewModel } from "./EnemyRenderPool.ts";
import { type PickupViewModel } from "./PickupRenderPool.ts";
import { type PlayerViewModel } from "./PlayerPresenter.ts";
import { type ProjectileViewModel } from "./ProjectileRenderPool.ts";
import { type WeaponEffectViewModel } from "./WeaponEffectPresenter.ts";
export interface PresentedRenderFrame {
    readonly elapsedSeconds: number;
    readonly player: PlayerViewModel;
    readonly enemies: readonly EnemyViewModel[];
    readonly projectiles: readonly ProjectileViewModel[];
    readonly pickups: readonly PickupViewModel[];
    readonly weaponEffects: readonly WeaponEffectViewModel[];
}
export declare class RenderPresenter {
    private readonly content;
    private readonly enemies;
    private readonly projectiles;
    private readonly pickups;
    constructor(content?: SimContent);
    present(snapshot: RenderSnapshot): PresentedRenderFrame;
}
//# sourceMappingURL=RenderPresenter.d.ts.map