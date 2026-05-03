import type { SimInput } from "../../sim/core/SimInput.ts";
import type { ClientInputSource } from "./ClientInputSource.ts";
export interface CocosInputSource extends ClientInputSource {
}
export declare function normalizeMovementAxes(moveX: number | undefined, moveY: number | undefined): {
    moveX: number;
    moveY: number;
};
export declare function adaptCocosInput(source: Readonly<CocosInputSource>): SimInput;
//# sourceMappingURL=CocosInputAdapter.d.ts.map