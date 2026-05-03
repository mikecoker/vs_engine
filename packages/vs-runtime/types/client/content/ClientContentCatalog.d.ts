import type { SimContent } from "../../sim/core/SimApi.ts";
export interface EntityVisualDef {
    readonly spriteKey: string;
    readonly displayName: string;
    readonly grantKind?: "xp" | "heal" | "magnet";
}
export interface UpgradeVisualDef {
    readonly iconKey: string;
    readonly displayName: string;
    readonly description: string;
    readonly behavior?: "projectile" | "aura" | "nova";
    readonly baseAreaRadius?: number;
    readonly baseDurationSeconds?: number;
}
export interface ClientContentCatalog {
    readonly enemies: readonly EntityVisualDef[];
    readonly projectiles: readonly EntityVisualDef[];
    readonly pickups: readonly EntityVisualDef[];
    readonly weapons: readonly UpgradeVisualDef[];
    readonly passives: readonly UpgradeVisualDef[];
}
export declare function createClientContentCatalog(content: SimContent): ClientContentCatalog;
//# sourceMappingURL=ClientContentCatalog.d.ts.map