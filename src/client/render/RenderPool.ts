export interface PositionedViewModel {
  visible: boolean;
  x: number;
  y: number;
}

export class RenderPool<T extends PositionedViewModel> {
  private readonly items: T[] = [];

  public constructor(private readonly createItem: () => T) {}

  public syncCount(count: number): void {
    while (this.items.length < count) {
      this.items.push(this.createItem());
    }

    for (let index = 0; index < this.items.length; index += 1) {
      this.items[index].visible = index < count;
    }
  }

  public getItems(): readonly T[] {
    return this.items;
  }
}
