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

interface SharedSheetLayout {
  readonly resourceKey: string;
  readonly cellSize: number;
  readonly frameCount: number;
  readonly rowBySpriteKey: Readonly<Record<string, number>>;
}

const SHARED_CHARACTER_SHEET: SharedSheetLayout = {
  resourceKey: "sheets/all_chars",
  cellSize: 513,
  frameCount: 4,
  rowBySpriteKey: {
    player_witch: 0,
    enemy_bat: 1,
    enemy_ghost: 2,
    enemy_skeleton: 3,
  },
};

const SPRITE_SHEET_RESOURCE_BY_KEY: Readonly<Record<string, string>> = {
  pickup_xp_large: "sheets/pickupxp_large_sheet",
  pickup_xp_medium: "sheets/pickupxp_medium_sheet",
};

function createTexture(image: ImageAsset): Texture2D {
  const texture = new Texture2D();
  texture.image = image;
  return texture;
}

function buildHorizontalFrames(texture: Texture2D, frameCount: number): readonly SpriteFrame[] {
  const image = texture.image as ImageAsset;
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

function buildGridRowFrames(
  texture: Texture2D,
  cellSize: number,
  rowIndex: number,
  frameCount: number,
): readonly SpriteFrame[] {
  const frames: SpriteFrame[] = [];

  for (let columnIndex = 0; columnIndex < frameCount; columnIndex += 1) {
    const frame = new SpriteFrame();
    frame.texture = texture;
    frame.rect = new Rect(columnIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
    frames.push(frame);
  }

  return frames;
}

function getSheetFps(spriteKey: string): number {
  return spriteKey === "player_witch" ? 6 : 8;
}

export class CocosSpriteLibrary {
  private readonly frames = new Map<string, SpriteAssetEntry | null>();
  private readonly pending = new Set<string>();
  private readonly textures = new Map<string, Texture2D>();

  public apply(
    node: Node,
    spriteKey: string,
    size: number,
    elapsedSeconds: number,
    fallbackColor: Readonly<Color>,
    tintColor?: Readonly<Color>,
  ): void {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(size, size);

    const sprite = ensureSprite(node);
    const graphics = ensureFallbackGraphics(node);

    if (!spriteKey) {
      sprite.spriteFrame = null;
      sprite.color = new Color(255, 255, 255, 255);
      drawFallbackCircle(graphics, fallbackColor, size);
      return;
    }

    if (this.frames.has(spriteKey)) {
      const entry = this.frames.get(spriteKey);
      if (!entry) {
        sprite.spriteFrame = null;
        sprite.color = new Color(255, 255, 255, 255);
        drawFallbackCircle(graphics, fallbackColor, size);
        return;
      }

      const frameIndex = entry.frames.length <= 1
        ? 0
        : Math.floor(elapsedSeconds * entry.fps) % entry.frames.length;
      sprite.spriteFrame = entry.frames[frameIndex] ?? entry.frames[0] ?? null;
      sprite.color = tintColor ? new Color(tintColor) : new Color(255, 255, 255, 255);
      graphics.clear();
      return;
    }

    if (!this.pending.has(spriteKey)) {
      this.pending.add(spriteKey);
      const sharedRowIndex = SHARED_CHARACTER_SHEET.rowBySpriteKey[spriteKey];
      if (sharedRowIndex !== undefined) {
        resources.load(SHARED_CHARACTER_SHEET.resourceKey, ImageAsset, (sharedError, sharedAsset) => {
          if (!sharedError && sharedAsset) {
            const texture = this.getOrCreateTexture(SHARED_CHARACTER_SHEET.resourceKey, sharedAsset);
            this.pending.delete(spriteKey);
            this.frames.set(spriteKey, {
              frames: buildGridRowFrames(
                texture,
                SHARED_CHARACTER_SHEET.cellSize,
                sharedRowIndex,
                SHARED_CHARACTER_SHEET.frameCount,
              ),
              fps: getSheetFps(spriteKey),
            });
            return;
          }

          this.loadStandaloneSprite(spriteKey);
        });
        sprite.spriteFrame = null;
        sprite.color = new Color(255, 255, 255, 255);
        drawFallbackCircle(graphics, fallbackColor, size);
        return;
      }

      this.loadStandaloneSprite(spriteKey);
    }

    sprite.spriteFrame = null;
    sprite.color = new Color(255, 255, 255, 255);
    drawFallbackCircle(graphics, fallbackColor, size);
  }

  private loadStandaloneSprite(spriteKey: string): void {
    const sheetResourceKey = SPRITE_SHEET_RESOURCE_BY_KEY[spriteKey] ?? `sheets/${spriteKey}_sheet`;
    resources.load(sheetResourceKey, ImageAsset, (sheetError, sheetAsset) => {
      if (!sheetError && sheetAsset) {
        const texture = this.getOrCreateTexture(sheetResourceKey, sheetAsset);
        this.pending.delete(spriteKey);
        this.frames.set(spriteKey, {
          frames: buildHorizontalFrames(texture, 4),
          fps: getSheetFps(spriteKey),
        });
        return;
      }

      resources.load(`sprites/${spriteKey}`, ImageAsset, (error, asset) => {
        this.pending.delete(spriteKey);
        if (error || !asset) {
          this.frames.set(spriteKey, null);
          return;
        }

        const texture = this.getOrCreateTexture(`sprites/${spriteKey}`, asset);
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        this.frames.set(spriteKey, {
          frames: [spriteFrame],
          fps: 1,
        });
      });
    });
  }

  private getOrCreateTexture(cacheKey: string, image: ImageAsset): Texture2D {
    const cached = this.textures.get(cacheKey);
    if (cached) {
      return cached;
    }

    const texture = createTexture(image);
    this.textures.set(cacheKey, texture);
    return texture;
  }
}
