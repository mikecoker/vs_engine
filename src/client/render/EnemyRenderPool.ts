import { RenderPool, type PositionedViewModel } from "./RenderPool";

export interface EnemyViewModel extends PositionedViewModel {
  key: string;
  typeId: number;
  spriteKey: string;
  displayName: string;
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
  }));

  public sync(activeCount: number): void {
    this.pool.syncCount(activeCount);
  }

  public getItems(): readonly EnemyViewModel[] {
    return this.pool.getItems();
  }
}
