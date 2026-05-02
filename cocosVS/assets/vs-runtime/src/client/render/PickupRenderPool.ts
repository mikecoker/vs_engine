import { RenderPool, type PositionedViewModel } from "./RenderPool.ts";

export interface PickupViewModel extends PositionedViewModel {
  key: string;
  typeId: number;
  spriteKey: string;
  displayName: string;
  grantKind: "xp" | "heal" | "magnet";
  tintColor?: { r: number; g: number; b: number; a: number };
  visualScale: number;
}

export const HEAL_PICKUP_TINT = { r: 255, g: 120, b: 210, a: 255 } as const;
export const MAGNET_PICKUP_TINT = { r: 120, g: 190, b: 255, a: 255 } as const;

export class PickupRenderPool {
  private readonly pool = new RenderPool<PickupViewModel>(() => ({
    key: "",
    visible: false,
    x: 0,
    y: 0,
    typeId: 0,
    spriteKey: "",
    displayName: "",
    grantKind: "xp",
    visualScale: 1,
  }));

  public sync(activeCount: number): void {
    this.pool.syncCount(activeCount);
  }

  public getItems(): readonly PickupViewModel[] {
    return this.pool.getItems();
  }
}
