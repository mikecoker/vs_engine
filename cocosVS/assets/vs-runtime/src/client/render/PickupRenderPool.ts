import { RenderPool, type PositionedViewModel } from "./RenderPool.ts";

export interface PickupViewModel extends PositionedViewModel {
  key: string;
  typeId: number;
  spriteKey: string;
  displayName: string;
}

export class PickupRenderPool {
  private readonly pool = new RenderPool<PickupViewModel>(() => ({
    key: "",
    visible: false,
    x: 0,
    y: 0,
    typeId: 0,
    spriteKey: "",
    displayName: "",
  }));

  public sync(activeCount: number): void {
    this.pool.syncCount(activeCount);
  }

  public getItems(): readonly PickupViewModel[] {
    return this.pool.getItems();
  }
}
