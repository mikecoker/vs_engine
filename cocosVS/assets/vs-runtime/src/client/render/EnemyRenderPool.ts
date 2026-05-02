import { RenderPool, type PositionedViewModel } from "./RenderPool.ts";

export interface EnemyViewModel extends PositionedViewModel {
  key: string;
  typeId: number;
  spriteKey: string;
  displayName: string;
  visualScale: number;
}

export class EnemyRenderPool {
  private readonly pool = new RenderPool<EnemyViewModel>(() => ({
    key: "",
    visible: false,
    x: 0,
    y: 0,
    typeId: 0,
    spriteKey: "",
    displayName: "",
    visualScale: 1,
  }));

  public sync(activeCount: number): void {
    this.pool.syncCount(activeCount);
  }

  public getItems(): readonly EnemyViewModel[] {
    return this.pool.getItems();
  }
}
