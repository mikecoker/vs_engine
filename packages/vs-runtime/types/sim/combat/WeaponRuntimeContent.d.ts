import type { WeaponDef } from "../content/ContentTypes.ts";
import type { SimContent } from "../core/SimApi.ts";
export interface WeaponRuntimeDef extends WeaponDef {
    readonly contentIndex: number;
    readonly projectileIndex: number;
}
export interface WeaponRuntimeContent {
    readonly weapons: readonly WeaponRuntimeDef[];
}
export declare function getWeaponRuntimeContent(content: SimContent): WeaponRuntimeContent | null;
export declare function getWeaponDefByIndex(content: SimContent, weaponIndex: number): WeaponRuntimeDef | null;
//# sourceMappingURL=WeaponRuntimeContent.d.ts.map