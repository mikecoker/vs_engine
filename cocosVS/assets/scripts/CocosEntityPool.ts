import { Color, Graphics, Node, UITransform } from "cc";

export interface SimpleEntityFrame {
  readonly visible: boolean;
  readonly key: string;
  readonly x: number;
  readonly y: number;
}

function ensureGraphicsNode(color: Readonly<Color>, radius: number): Node {
  const node = new Node();
  const transform = node.addComponent(UITransform);
  transform.setContentSize(radius * 2, radius * 2);

  const graphics = node.addComponent(Graphics);
  graphics.fillColor = new Color(color);
  graphics.circle(0, 0, radius);
  graphics.fill();
  return node;
}

export class CocosEntityPool<T extends SimpleEntityFrame> {
  private readonly nodes: Node[] = [];

  public constructor(
    private readonly parent: Node,
    private readonly color: Readonly<Color>,
    private readonly radius: number,
  ) {}

  public sync(items: readonly T[], centerX: number, centerY: number, worldScale: number): void {
    while (this.nodes.length < items.length) {
      const node = ensureGraphicsNode(this.color, this.radius);
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
      node.setPosition(
        (item.x - centerX) * worldScale,
        (item.y - centerY) * worldScale,
        0,
      );
    }
  }
}
