import {
  Color,
  Graphics,
  ImageAsset,
  Rect,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  Texture2D,
  UITransform,
} from "cc";

function ensureFallbackGraphics(node: Node): Graphics {
  const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
  return graphics;
}

function ensureSprite(node: Node): Sprite {
  const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  return sprite;
}

function drawFallbackCircle(graphics: Graphics, color: Readonly<Color>, size: number): void {
  graphics.clear();
  graphics.fillColor = new Color(color);
  graphics.circle(0, 0, Math.max(4, size * 0.5));
  graphics.fill();
}

interface SpriteAssetEntry {
  readonly frames: readonly SpriteFrame[];
  readonly fps: number;
}

function buildHorizontalFrames(image: ImageAsset, frameCount: number): readonly SpriteFrame[] {
  const texture = new Texture2D();
  texture.image = image;
  const frameWidth = Math.floor(image.width / frameCount);
  const frames: SpriteFrame[] = [];

  for (let index = 0; index < frameCount; index += 1) {
    const frame = new SpriteFrame();
    frame.texture = texture;
    frame.rect = new Rect(index * frameWidth, 0, frameWidth, image.height);
    frames.push(frame);
  }

  return frames;
}

export class CocosSpriteLibrary {
  private readonly frames = new Map<string, SpriteAssetEntry | null>();
  private readonly pending = new Set<string>();

  public apply(
    node: Node,
    spriteKey: string,
    size: number,
    elapsedSeconds: number,
    fallbackColor: Readonly<Color>,
  ): void {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(size, size);

    const sprite = ensureSprite(node);
    const graphics = ensureFallbackGraphics(node);

    if (!spriteKey) {
      sprite.spriteFrame = null;
      drawFallbackCircle(graphics, fallbackColor, size);
      return;
    }

    if (this.frames.has(spriteKey)) {
      const entry = this.frames.get(spriteKey);
      if (!entry) {
        sprite.spriteFrame = null;
        drawFallbackCircle(graphics, fallbackColor, size);
        return;
      }

      const frameIndex = entry.frames.length <= 1
        ? 0
        : Math.floor(elapsedSeconds * entry.fps) % entry.frames.length;
      sprite.spriteFrame = entry.frames[frameIndex] ?? entry.frames[0] ?? null;
      graphics.clear();
      return;
    }

    if (!this.pending.has(spriteKey)) {
      this.pending.add(spriteKey);
      resources.load(`sheets/${spriteKey}_sheet`, ImageAsset, (sheetError, sheetAsset) => {
        if (!sheetError && sheetAsset) {
          this.pending.delete(spriteKey);
          this.frames.set(spriteKey, {
            frames: buildHorizontalFrames(sheetAsset, 4),
            fps: spriteKey === "player_witch" ? 6 : 8,
          });
          return;
        }

        resources.load(`sprites/${spriteKey}`, ImageAsset, (error, asset) => {
          this.pending.delete(spriteKey);
          if (error || !asset) {
            this.frames.set(spriteKey, null);
            return;
          }

          const texture = new Texture2D();
          texture.image = asset;
          const spriteFrame = new SpriteFrame();
          spriteFrame.texture = texture;
          this.frames.set(spriteKey, {
            frames: [spriteFrame],
            fps: 1,
          });
        });
      });
    }

    sprite.spriteFrame = null;
    drawFallbackCircle(graphics, fallbackColor, size);
  }
}
