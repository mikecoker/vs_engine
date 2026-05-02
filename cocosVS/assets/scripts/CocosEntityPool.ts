import { Color, Node, UITransform } from "cc";
import { CocosSpriteLibrary } from "./CocosSpriteLibrary.ts";

export interface SimpleEntityFrame {
  readonly visible: boolean;
  readonly key: string;
  readonly x: number;
  readonly y: number;
}

function ensureEntityNode(size: number): Node {
  const node = new Node();
  const transform = node.addComponent(UITransform);
  transform.setContentSize(size, size);
  return node;
}

export class CocosEntityPool<T extends SimpleEntityFrame> {
  private readonly nodes: Node[] = [];

  public constructor(
    private readonly parent: Node,
    private readonly sprites: CocosSpriteLibrary,
    private readonly color: Readonly<Color>,
    private readonly size: number,
  ) {}

  public sync(
    items: readonly T[],
    centerX: number,
    centerY: number,
    worldScale: number,
    elapsedSeconds: number,
  ): void {
    while (this.nodes.length < items.length) {
      const node = ensureEntityNode(this.size);
      node.parent = this.parent;
      this.nodes.push(node);
    }

    for (let index = 0; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];
      const item = items[index];
      if (!item?.visible) {
        node.active = false;
        continue;
      }

      node.active = true;
      this.sprites.apply(
        node,
        (item as T & { spriteKey?: string }).spriteKey ?? "",
        this.size,
        elapsedSeconds,
        this.color,
        (item as T & { tintColor?: { r: number; g: number; b: number; a: number } }).tintColor
          ? new Color(
              (item as T & { tintColor: { r: number; g: number; b: number; a: number } }).tintColor.r,
              (item as T & { tintColor: { r: number; g: number; b: number; a: number } }).tintColor.g,
              (item as T & { tintColor: { r: number; g: number; b: number; a: number } }).tintColor.b,
              (item as T & { tintColor: { r: number; g: number; b: number; a: number } }).tintColor.a,
            )
          : undefined,
      );
      node.setPosition(
        (item.x - centerX) * worldScale,
        (item.y - centerY) * worldScale,
        0,
      );
      const visualScale = (item as T & { visualScale?: number }).visualScale ?? 1;
      node.setScale(visualScale, visualScale, 1);
    }
  }
}
