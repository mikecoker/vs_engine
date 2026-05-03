import { RenderPool, type PositionedViewModel } from "./RenderPool.ts";

export interface ProjectileViewModel extends PositionedViewModel {
  key: string;
  typeId: number;
  spriteKey: string;
  displayName: string;
}

export class ProjectileRenderPool {
  private readonly pool = new RenderPool<ProjectileViewModel>(() => ({
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

  public getItems(): readonly ProjectileViewModel[] {
    return this.pool.getItems();
  }
}
