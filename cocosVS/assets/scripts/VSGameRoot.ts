import {
  _decorator,
  Canvas,
  Color,
  Component,
  EffectAsset,
  Graphics,
  ImageAsset,
  Material,
  Node,
  Label,
  Sprite,
  SpriteFrame,
  UITransform,
  view,
  resources,
} from "cc";
import {
  ClientSession,
  createSim,
  DEFAULT_SIM_BOUNDS,
  loadPrototypeContentRegistry,
  type ClientFrame,
} from "@vs-engine/runtime";
import { CocosEntityPool } from "./CocosEntityPool.ts";
import { CocosInputState } from "./CocosInputState.ts";
import { CocosSpriteLibrary } from "./CocosSpriteLibrary.ts";

const { ccclass, property } = _decorator;

const PLAYER_VISUAL_SIZE = 66;
const ENEMY_VISUAL_SIZE = 56;
const PROJECTILE_VISUAL_SIZE = 16;
const PICKUP_VISUAL_SIZE = 18;
const WEAPON_EFFECT_RADIUS_SCALE = 1.15;
const PLAYER_HIT_FLASH_SECONDS = 0.22;
const BORDER_HIT_FLASH_SECONDS = 0.35;
const SCREEN_SHAKE_SECONDS = 0.2;
const SCREEN_SHAKE_AMPLITUDE = 10;
const PLAYER_HIT_FLASH_SCALE = 1.08;
const PLAYER_FLASH_EFFECT_PATH = "effects/player_flash";
const TERRAIN_BASE_TILE_PATH = "tiles/field_tile_01_256";
const TERRAIN_OVERLAY_TILE_PATH = "tiles/field_tile_02_256";
const TERRAIN_WORLD_TEXTURE_SIZE = 2048;
const DEFAULT_TERRAIN_MASK_NOISE_SCALE = 2.35;
const DEFAULT_TERRAIN_MASK_CUTOFF = 0.48;
const DEFAULT_TERRAIN_MASK_FALLOFF = 0.28;
const DEFAULT_TERRAIN_MASK_BLUR_RADIUS = 18;
const DEFAULT_TERRAIN_OVERLAY_OPACITY = 0.72;
const OUT_OF_BOUNDS_SHADE_ALPHA = 78;
const OUT_OF_BOUNDS_EDGE_ALPHA = 190;

type TerrainDebugMode = "blend" | "base_only" | "overlay_only" | "mask";

interface TerrainChunkRuntime {
  readonly node: Node;
  readonly sprite: Sprite;
  chunkX: number;
  chunkY: number;
  frameKey: string;
}

@ccclass("VSGameRoot")
export class VSGameRoot extends Component {
  @property
  public worldScale = 2;

  @property
  public followPlayer = true;

  @property
  public terrainMaskNoiseScale = DEFAULT_TERRAIN_MASK_NOISE_SCALE;

  @property
  public terrainMaskCutoff = DEFAULT_TERRAIN_MASK_CUTOFF;

  @property
  public terrainMaskFalloff = DEFAULT_TERRAIN_MASK_FALLOFF;

  @property
  public terrainMaskBlurRadius = DEFAULT_TERRAIN_MASK_BLUR_RADIUS;

  @property
  public terrainOverlayOpacity = DEFAULT_TERRAIN_OVERLAY_OPACITY;

  private readonly inputState = new CocosInputState();
  private readonly sprites = new CocosSpriteLibrary();
  private readonly content = loadPrototypeContentRegistry();
  private readonly sim = createSim({}, this.content, 1);
  private readonly session = new ClientSession(this.sim, this.content);

  private worldLayer: Node | null = null;
  private terrainLayer: Node | null = null;
  private boundsShadeNode: Node | null = null;
  private hudLabel: Label | null = null;
  private overlayLabel: Label | null = null;
  private borderFlashNode: Node | null = null;
  private healIndicatorNode: Node | null = null;
  private magnetIndicatorNode: Node | null = null;
  private playerNode: Node | null = null;
  private auraNode: Node | null = null;
  private novaNode: Node | null = null;
  private latestMoveX = 0;
  private latestMoveY = 0;
  private lastHp = 0;
  private playerHitFlashRemaining = 0;
  private borderHitFlashRemaining = 0;
  private screenShakeRemaining = 0;
  private shakePhase = 0;
  private playerFlashMaterial: Material | null = null;
  private terrainBaseImage: ImageAsset | null = null;
  private terrainOverlayImage: ImageAsset | null = null;
  private readonly terrainFrameCache = new Map<string, SpriteFrame>();
  private terrainWorldNode: Node | null = null;
  private terrainWorldSprite: Sprite | null = null;
  private terrainWorldFrameKey = "";
  private terrainDebugMode: TerrainDebugMode = "blend";
  private terrainChunks: TerrainChunkRuntime[] = [];
  private enemyPool: CocosEntityPool<ClientFrame["render"]["enemies"][number]> | null = null;
  private projectilePool: CocosEntityPool<ClientFrame["render"]["projectiles"][number]> | null = null;
  private pickupPool: CocosEntityPool<ClientFrame["render"]["pickups"][number]> | null = null;

  protected onLoad(): void {
    this.followPlayer = true;
    this.ensureSceneNodes();
    this.loadTerrainAssets();
    this.loadPlayerFlashMaterial();
    this.inputState.enable();
    this.session.dispatch({
      type: "reset_run",
      seed: 1,
    });
    this.renderFrame(this.session.capture(), 0);
  }

  protected onDestroy(): void {
    this.inputState.disable();
  }

  protected update(dt: number): void {
    const pendingChoice = this.inputState.consumeUpgradeChoice();
    if (pendingChoice !== null) {
      this.session.dispatch({
        type: "select_upgrade",
        choiceIndex: pendingChoice,
      });
    }

    if (this.inputState.consumeToggleTerrainBase()) {
      this.terrainDebugMode = this.terrainDebugMode === "blend"
        ? "base_only"
        : this.terrainDebugMode === "base_only"
          ? "overlay_only"
          : this.terrainDebugMode === "overlay_only"
            ? "mask"
            : "blend";
      this.refreshTerrainWorldAsset(true);
    }

    const inputFrame = this.inputState.toClientInput();
    this.latestMoveX = inputFrame.moveX;
    this.latestMoveY = inputFrame.moveY;
    const frame = this.session.step(dt, inputFrame);
    this.renderFrame(frame, dt);
  }

  private ensureSceneNodes(): void {
    const canvasNode = this.getComponent(Canvas)?.node ?? this.node;
    const canvasTransform = canvasNode.getComponent(UITransform) ?? canvasNode.addComponent(UITransform);
    const visible = view.getVisibleSize();
    canvasTransform.setContentSize(visible.width, visible.height);

    this.worldLayer = new Node("WorldLayer");
    this.worldLayer.parent = canvasNode;
    this.worldLayer.setPosition(0, 0, 0);

    const backgroundNode = new Node("Background");
    backgroundNode.parent = this.worldLayer;
    this.drawBackground(backgroundNode, visible.width, visible.height);

    this.terrainLayer = new Node("TerrainChunks");
    this.terrainLayer.parent = this.worldLayer;
    this.buildTerrainChunkRing();

    this.boundsShadeNode = new Node("BoundsShade");
    this.boundsShadeNode.parent = this.worldLayer;

    this.playerNode = this.createVisualNode("Player", PLAYER_VISUAL_SIZE);
    this.playerNode.parent = this.worldLayer;
    this.auraNode = this.createRingNode("Aura", new Color(120, 220, 255, 120), 2);
    this.auraNode.parent = this.worldLayer;
    this.novaNode = this.createRingNode("Nova", new Color(255, 235, 120, 220), 3);
    this.novaNode.parent = this.worldLayer;

    this.enemyPool = new CocosEntityPool(this.worldLayer, this.sprites, new Color(220, 80, 80, 255), ENEMY_VISUAL_SIZE);
    this.projectilePool = new CocosEntityPool(this.worldLayer, this.sprites, new Color(255, 220, 80, 255), PROJECTILE_VISUAL_SIZE);
    this.pickupPool = new CocosEntityPool(this.worldLayer, this.sprites, new Color(80, 220, 120, 255), PICKUP_VISUAL_SIZE);

    this.hudLabel = this.createLabelNode("Hud", 18, new Color(255, 255, 255, 255));
    this.hudLabel.node.parent = canvasNode;
    this.hudLabel.node.setPosition(-visible.width / 2 + 20, visible.height / 2 - 20, 0);

    this.overlayLabel = this.createLabelNode("Overlay", 20, new Color(255, 235, 160, 255));
    this.overlayLabel.node.parent = canvasNode;
    this.overlayLabel.node.setPosition(-visible.width / 2 + 20, visible.height / 2 - 92, 0);

    this.borderFlashNode = new Node("BorderFlash");
    this.borderFlashNode.parent = canvasNode;
    this.drawBorderFlash(this.borderFlashNode, visible.width, visible.height, 0);

    this.healIndicatorNode = new Node("HealIndicator");
    this.healIndicatorNode.parent = canvasNode;
    this.healIndicatorNode.active = false;

    this.magnetIndicatorNode = new Node("MagnetIndicator");
    this.magnetIndicatorNode.parent = canvasNode;
    this.magnetIndicatorNode.active = false;
  }

  private renderFrame(frame: ClientFrame, dt: number): void {
    this.updateDamageIndicators(frame, dt);
    const centerX = frame.camera.centerX;
    const centerY = frame.camera.centerY;
    this.applyScreenShake();
    this.updateTerrainChunks(centerX, centerY);
    this.renderBoundsShade(centerX, centerY);
    const playerFlashScale = this.playerHitFlashRemaining > 0
      ? this.getPlayerFlashScale()
      : 1;

    if (this.playerNode) {
      this.playerNode.active = frame.render.player.visible;
      this.applyPlayerFlashMaterial();
      this.sprites.apply(
        this.playerNode,
        frame.render.player.spriteKey,
        PLAYER_VISUAL_SIZE,
        frame.render.elapsedSeconds,
        new Color(255, 255, 255, 255),
        new Color(255, 255, 255, 255),
      );
      this.playerNode.setPosition(
        (frame.render.player.x - centerX) * this.worldScale,
        (frame.render.player.y - centerY) * this.worldScale,
        0,
      );
      this.playerNode.setScale(playerFlashScale, playerFlashScale, 1);
      this.syncPlayerFlashUniform();
    }

    this.enemyPool?.sync(frame.render.enemies, centerX, centerY, this.worldScale, frame.render.elapsedSeconds);
    this.projectilePool?.sync(frame.render.projectiles, centerX, centerY, this.worldScale, frame.render.elapsedSeconds);
    this.pickupPool?.sync(frame.render.pickups, centerX, centerY, this.worldScale, frame.render.elapsedSeconds);
    this.renderWeaponEffects(frame, centerX, centerY);

    if (this.hudLabel) {
      this.hudLabel.string =
        `HP ${Math.round(frame.hud.hp)}/${Math.round(frame.hud.maxHp)}  ` +
        `LV ${frame.hud.level}  XP ${frame.hud.xp}/${frame.hud.xpToNext}  ` +
        `EN ${frame.debug.activeEnemyCount}  PR ${frame.debug.activeProjectileCount}  ` +
        `PU ${frame.debug.activePickupCount}\n` +
        `POS ${frame.render.player.x.toFixed(1)}, ${frame.render.player.y.toFixed(1)}  ` +
        `IN ${this.latestMoveX.toFixed(0)}, ${this.latestMoveY.toFixed(0)}  ` +
        `CAM FOLLOW  ` +
        `TERRAIN ${this.terrainDebugMode.toUpperCase()}  ` +
        `INVULN ${frame.debug.playerInvulnerable ? "ON" : "OFF"}`;
    }

    if (this.overlayLabel) {
      const lines: string[] = [];
      lines.push(`STATE: ${frame.runState.runState}`);
      if (frame.levelUp.visible) {
        lines.push(`LEVEL UP (${frame.levelUp.queuedLevelUps} queued)`);
        frame.levelUp.choices.forEach((choice, index) => {
          lines.push(`${index + 1}. ${choice.displayName} ${choice.currentLevel}->${choice.nextLevel}/${choice.maxLevel}`);
          lines.push(`   ${choice.description}`);
        });
      } else if (frame.runState.showGameOverOverlay) {
        lines.push("GAME OVER");
      } else {
        lines.push("Controls: WASD move, P pause, 1/2/3 choose, G XP, V +10 mobs, I invuln, B terrain");
        lines.push("Player vel readout comes from position delta; camera is following");
      }
      this.overlayLabel.string = lines.join("\n");
    }

    this.renderBorderFlash();
    this.renderSpecialPickupIndicator(frame, centerX, centerY, "heal", this.healIndicatorNode, new Color(255, 120, 210, 230));
    this.renderSpecialPickupIndicator(frame, centerX, centerY, "magnet", this.magnetIndicatorNode, new Color(120, 190, 255, 230));
  }

  private renderWeaponEffects(frame: ClientFrame, centerX: number, centerY: number): void {
    let auraEffect = null;
    let novaEffect = null;

    for (const effect of frame.render.weaponEffects) {
      if (effect.behavior === "aura") {
        auraEffect = effect;
      } else if (effect.behavior === "nova") {
        novaEffect = effect;
      }
    }

    this.syncRingNode(this.auraNode, auraEffect, centerX, centerY);
    this.syncRingNode(this.novaNode, novaEffect, centerX, centerY);
  }

  private syncRingNode(
    node: Node | null,
    effect: ClientFrame["render"]["weaponEffects"][number] | null,
    centerX: number,
    centerY: number,
  ): void {
    if (!node) {
      return;
    }

    const graphics = node.getComponent(Graphics);
    const transform = node.getComponent(UITransform);
    if (!graphics || !transform || !effect?.visible) {
      node.active = false;
      return;
    }

    node.active = true;
    node.setPosition(
      (effect.x - centerX) * this.worldScale,
      (effect.y - centerY) * this.worldScale,
      0,
    );
    this.drawRing(
      graphics,
      transform,
      effect.radius * this.worldScale * WEAPON_EFFECT_RADIUS_SCALE,
      effect.alpha,
    );
  }

  private drawBackground(node: Node, width: number, height: number): void {
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(18, 24, 34, 255);
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  private loadTerrainAssets(): void {
    resources.load(TERRAIN_BASE_TILE_PATH, ImageAsset, (error, asset) => {
      if (error || !asset) {
        return;
      }

      this.terrainBaseImage = asset;
      this.refreshTerrainChunkAssets(true);
    });

    resources.load(TERRAIN_OVERLAY_TILE_PATH, ImageAsset, (error, asset) => {
      if (error || !asset) {
        return;
      }

      this.terrainOverlayImage = asset;
      this.refreshTerrainChunkAssets(true);
    });
  }

  private buildTerrainChunkRing(): void {
    if (!this.terrainLayer) {
      return;
    }

    this.terrainWorldNode = new Node("TerrainWorld");
    this.terrainWorldNode.parent = this.terrainLayer;
    const transform = this.terrainWorldNode.addComponent(UITransform);
    const bounds = this.sim.config.bounds?.spawn ?? DEFAULT_SIM_BOUNDS.spawn;
    transform.setContentSize(
      (bounds.maxX - bounds.minX) * this.worldScale,
      (bounds.maxY - bounds.minY) * this.worldScale,
    );
    this.terrainWorldSprite = this.terrainWorldNode.addComponent(Sprite);
    this.terrainWorldSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.terrainWorldSprite.type = Sprite.Type.SIMPLE;
  }

  private refreshTerrainChunkAssets(force = false): void {
    this.refreshTerrainWorldAsset(force);
    for (const chunk of this.terrainChunks) {
      if (Number.isNaN(chunk.chunkX) || Number.isNaN(chunk.chunkY)) {
        continue;
      }

      this.refreshTerrainChunkAsset(chunk, force);
    }
  }

  private refreshTerrainChunkAsset(chunk: TerrainChunkRuntime, force = false): void {
    const frameKey = `${this.terrainDebugMode}:${chunk.chunkX}:${chunk.chunkY}`;
    if (!force && chunk.frameKey === frameKey) {
      return;
    }

    const frame = this.getTerrainFrame(this.terrainDebugMode, chunk.chunkX, chunk.chunkY);
    if (!frame) {
      return;
    }

    chunk.frameKey = frameKey;
    chunk.sprite.spriteFrame = frame;
    chunk.sprite.type = Sprite.Type.SIMPLE;
    chunk.sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    chunk.sprite.color = new Color(255, 255, 255, 255);
    chunk.sprite.customMaterial = null;
  }

  private refreshTerrainWorldAsset(force = false): void {
    if (!this.terrainWorldSprite) {
      return;
    }

    const frameKey = this.terrainDebugMode;
    if (!force && this.terrainWorldFrameKey === frameKey) {
      return;
    }

    const frame = this.getTerrainFrame(this.terrainDebugMode);
    if (!frame) {
      return;
    }

    this.terrainWorldFrameKey = frameKey;
    this.terrainWorldSprite.spriteFrame = frame;
    this.terrainWorldSprite.type = Sprite.Type.SIMPLE;
    this.terrainWorldSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.terrainWorldSprite.color = new Color(255, 255, 255, 255);
    this.terrainWorldSprite.customMaterial = null;
  }

  private updateTerrainChunks(centerX: number, centerY: number): void {
    if (this.terrainWorldNode) {
      const bounds = this.sim.config.bounds?.spawn ?? DEFAULT_SIM_BOUNDS.spawn;
      this.terrainWorldNode.setPosition(
        ((bounds.minX + bounds.maxX) * 0.5 - centerX) * this.worldScale,
        ((bounds.minY + bounds.maxY) * 0.5 - centerY) * this.worldScale,
        0,
      );
      this.refreshTerrainWorldAsset();
    }

    if (this.terrainChunks.length === 0) {
      return;
    }
  }

  private getTerrainFrame(mode: TerrainDebugMode, chunkX = 0, chunkY = 0): SpriteFrame | null {
    if (!this.terrainBaseImage || !this.terrainOverlayImage) {
      return null;
    }

    const frameKey = mode;
    const cached = this.terrainFrameCache.get(frameKey);
    if (cached) {
      return cached;
    }

    const width = TERRAIN_WORLD_TEXTURE_SIZE;
    const height = TERRAIN_WORLD_TEXTURE_SIZE;
    const bounds = this.sim.config.bounds?.spawn ?? DEFAULT_SIM_BOUNDS.spawn;
    const baseCanvas = this.drawRepeatedTerrainTile(this.terrainBaseImage, width, height, bounds);
    const overlayCanvas = this.drawRepeatedTerrainTile(this.terrainOverlayImage, width, height, bounds);
    const maskValues = this.generateTerrainMask(width, height, bounds);
    const canvas = mode === "base_only"
      ? baseCanvas
      : mode === "overlay_only"
        ? overlayCanvas
        : mode === "mask"
          ? this.drawTerrainMask(maskValues, width, height)
          : this.drawBlendedTerrain(baseCanvas, overlayCanvas, maskValues);
    const frame = SpriteFrame.createWithImage(canvas);
    this.terrainFrameCache.set(frameKey, frame);
    return frame;
  }

  private drawRepeatedTerrainTile(
    image: ImageAsset,
    width: number,
    height: number,
    bounds: typeof DEFAULT_SIM_BOUNDS.spawn,
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context || !image.data) {
      return canvas;
    }

    const source = image.data as CanvasImageSource;
    const sourceWidth = "width" in source ? Number(source.width) : TERRAIN_WORLD_TEXTURE_SIZE;
    const sourceHeight = "height" in source ? Number(source.height) : TERRAIN_WORLD_TEXTURE_SIZE;
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;
    const pixelsPerWorldX = width / worldWidth;
    const pixelsPerWorldY = height / worldHeight;
    const patternOffsetX = (((bounds.minX * pixelsPerWorldX) % sourceWidth) + sourceWidth) % sourceWidth;
    const patternOffsetY = (((bounds.minY * pixelsPerWorldY) % sourceHeight) + sourceHeight) % sourceHeight;
    const pattern = context.createPattern(image.data as any, "repeat");
    if (pattern) {
      context.save();
      context.translate(-patternOffsetX, -patternOffsetY);
      context.fillStyle = pattern;
      context.fillRect(patternOffsetX, patternOffsetY, canvas.width, canvas.height);
      context.restore();
    }

    return canvas;
  }

  private generateTerrainMask(width: number, height: number, bounds: typeof DEFAULT_SIM_BOUNDS.spawn): Float32Array {
    const blurRadius = Math.max(0, Math.round(this.terrainMaskBlurRadius));
    const raw = new Float32Array(width * height);
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const worldX = bounds.minX + (x / Math.max(1, width - 1)) * worldWidth;
        const worldY = bounds.minY + (y / Math.max(1, height - 1)) * worldHeight;
        const nx = ((worldX - bounds.minX) / worldWidth) * this.terrainMaskNoiseScale;
        const ny = ((worldY - bounds.minY) / worldHeight) * this.terrainMaskNoiseScale;
        const coarse = this.valueNoise(nx, ny);
        const detail = this.valueNoise(nx * 2.7 + 11.3, ny * 2.7 + 7.1);
        raw[y * width + x] = coarse * 0.78 + detail * 0.22;
      }
    }

    const blurred = this.gaussianBlurMask(raw, width, height, blurRadius);
    const alpha = new Float32Array(width * height);
    for (let index = 0; index < blurred.length; index += 1) {
      alpha[index] = this.smoothstep(
        this.terrainMaskCutoff,
        this.terrainMaskCutoff + this.terrainMaskFalloff,
        blurred[index],
      );
    }

    return alpha;
  }

  private gaussianBlurMask(source: Float32Array, width: number, height: number, radius: number): Float32Array {
    if (radius <= 0) {
      return source;
    }

    const kernel = this.buildGaussianKernel(radius);
    const temp = new Float32Array(source.length);
    const output = new Float32Array(source.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = 0;
        for (let offset = -radius; offset <= radius; offset += 1) {
          const sampleX = Math.max(0, Math.min(width - 1, x + offset));
          total += source[y * width + sampleX] * kernel[offset + radius];
        }
        temp[y * width + x] = total;
      }
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = 0;
        for (let offset = -radius; offset <= radius; offset += 1) {
          const sampleY = Math.max(0, Math.min(height - 1, y + offset));
          total += temp[sampleY * width + x] * kernel[offset + radius];
        }
        output[y * width + x] = total;
      }
    }

    return output;
  }

  private buildGaussianKernel(radius: number): Float32Array {
    const kernel = new Float32Array(radius * 2 + 1);
    const sigma = Math.max(1, radius / 2.5);
    let sum = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
      const value = Math.exp(-(offset * offset) / (2 * sigma * sigma));
      kernel[offset + radius] = value;
      sum += value;
    }

    for (let index = 0; index < kernel.length; index += 1) {
      kernel[index] /= sum;
    }

    return kernel;
  }

  private drawTerrainMask(maskValues: Float32Array, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return canvas;
    }

    const imageData = context.createImageData(width, height);
    for (let index = 0; index < maskValues.length; index += 1) {
      const value = Math.round(maskValues[index] * 255);
      const pixelIndex = index * 4;
      imageData.data[pixelIndex] = value;
      imageData.data[pixelIndex + 1] = value;
      imageData.data[pixelIndex + 2] = value;
      imageData.data[pixelIndex + 3] = 255;
    }
    context.putImageData(imageData, 0, 0);
    return canvas;
  }

  private drawBlendedTerrain(
    baseCanvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement,
    maskValues: Float32Array,
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = baseCanvas.width;
    canvas.height = baseCanvas.height;
    const context = canvas.getContext("2d");
    const baseContext = baseCanvas.getContext("2d");
    const overlayContext = overlayCanvas.getContext("2d");
    if (!context || !baseContext || !overlayContext) {
      return canvas;
    }

    const baseData = baseContext.getImageData(0, 0, canvas.width, canvas.height);
    const overlayData = overlayContext.getImageData(0, 0, canvas.width, canvas.height);
    const output = context.createImageData(canvas.width, canvas.height);
    for (let index = 0; index < maskValues.length; index += 1) {
      const blend = Math.max(0, Math.min(1, maskValues[index] * this.terrainOverlayOpacity));
      const pixelIndex = index * 4;
      output.data[pixelIndex] = Math.round(
        baseData.data[pixelIndex] + (overlayData.data[pixelIndex] - baseData.data[pixelIndex]) * blend,
      );
      output.data[pixelIndex + 1] = Math.round(
        baseData.data[pixelIndex + 1] + (overlayData.data[pixelIndex + 1] - baseData.data[pixelIndex + 1]) * blend,
      );
      output.data[pixelIndex + 2] = Math.round(
        baseData.data[pixelIndex + 2] + (overlayData.data[pixelIndex + 2] - baseData.data[pixelIndex + 2]) * blend,
      );
      output.data[pixelIndex + 3] = 255;
    }
    context.putImageData(output, 0, 0);
    return canvas;
  }

  private valueNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    const a = this.hash2(ix, iy);
    const b = this.hash2(ix + 1, iy);
    const c = this.hash2(ix, iy + 1);
    const d = this.hash2(ix + 1, iy + 1);

    const ab = a + (b - a) * ux;
    const cd = c + (d - c) * ux;
    return ab + (cd - ab) * uy;
  }

  private hash2(x: number, y: number): number {
    const sinValue = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return sinValue - Math.floor(sinValue);
  }

  private smoothstep(edge0: number, edge1: number, value: number): number {
    const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  private renderBoundsShade(centerX: number, centerY: number): void {
    if (!this.boundsShadeNode) {
      return;
    }

    const visible = view.getVisibleSize();
    const graphics = this.boundsShadeNode.getComponent(Graphics) ?? this.boundsShadeNode.addComponent(Graphics);
    const transform = this.boundsShadeNode.getComponent(UITransform) ?? this.boundsShadeNode.addComponent(UITransform);
    transform.setContentSize(visible.width, visible.height);
    graphics.clear();

    const halfWorldWidth = visible.width / (2 * this.worldScale);
    const halfWorldHeight = visible.height / (2 * this.worldScale);
    const viewMinX = centerX - halfWorldWidth;
    const viewMaxX = centerX + halfWorldWidth;
    const viewMinY = centerY - halfWorldHeight;
    const viewMaxY = centerY + halfWorldHeight;
    const playerBounds = this.sim.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player;

    const drawRect = (minX: number, minY: number, maxX: number, maxY: number): void => {
      const width = maxX - minX;
      const height = maxY - minY;
      if (width <= 0 || height <= 0) {
        return;
      }

      graphics.rect(
        (minX - centerX) * this.worldScale,
        (minY - centerY) * this.worldScale,
        width * this.worldScale,
        height * this.worldScale,
      );
    };

    graphics.fillColor = new Color(10, 12, 18, OUT_OF_BOUNDS_SHADE_ALPHA);
    drawRect(viewMinX, viewMinY, Math.min(playerBounds.minX, viewMaxX), viewMaxY);
    drawRect(Math.max(playerBounds.maxX, viewMinX), viewMinY, viewMaxX, viewMaxY);
    drawRect(
      Math.max(viewMinX, playerBounds.minX),
      viewMinY,
      Math.min(viewMaxX, playerBounds.maxX),
      Math.min(playerBounds.minY, viewMaxY),
    );
    drawRect(
      Math.max(viewMinX, playerBounds.minX),
      Math.max(playerBounds.maxY, viewMinY),
      Math.min(viewMaxX, playerBounds.maxX),
      viewMaxY,
    );
    graphics.fill();

    const clampedMinX = Math.max(viewMinX, playerBounds.minX);
    const clampedMaxX = Math.min(viewMaxX, playerBounds.maxX);
    const clampedMinY = Math.max(viewMinY, playerBounds.minY);
    const clampedMaxY = Math.min(viewMaxY, playerBounds.maxY);
    if (clampedMinX < clampedMaxX && clampedMinY < clampedMaxY) {
      graphics.lineWidth = 2;
      graphics.strokeColor = new Color(255, 210, 115, OUT_OF_BOUNDS_EDGE_ALPHA);
      graphics.rect(
        (clampedMinX - centerX) * this.worldScale,
        (clampedMinY - centerY) * this.worldScale,
        (clampedMaxX - clampedMinX) * this.worldScale,
        (clampedMaxY - clampedMinY) * this.worldScale,
      );
      graphics.stroke();
    }
  }

  private updateDamageIndicators(frame: ClientFrame, dt: number): void {
    const currentHp = frame.hud.hp;
    if (this.lastHp > 0 && currentHp < this.lastHp) {
      this.playerHitFlashRemaining = PLAYER_HIT_FLASH_SECONDS;
      this.borderHitFlashRemaining = BORDER_HIT_FLASH_SECONDS;
      this.screenShakeRemaining = SCREEN_SHAKE_SECONDS;
    }

    this.lastHp = currentHp;
    this.playerHitFlashRemaining = Math.max(0, this.playerHitFlashRemaining - dt);
    this.borderHitFlashRemaining = Math.max(0, this.borderHitFlashRemaining - dt);
    this.screenShakeRemaining = Math.max(0, this.screenShakeRemaining - dt);
    this.shakePhase += dt * 60;
  }

  private getPlayerFlashScale(): number {
    const intensity = Math.max(0, Math.min(1, this.playerHitFlashRemaining / PLAYER_HIT_FLASH_SECONDS));
    return 1 + (PLAYER_HIT_FLASH_SCALE - 1) * intensity;
  }

  private renderBorderFlash(): void {
    if (!this.borderFlashNode) {
      return;
    }

    const visible = view.getVisibleSize();
    const alpha = this.borderHitFlashRemaining <= 0
      ? 0
      : Math.round(235 * (this.borderHitFlashRemaining / BORDER_HIT_FLASH_SECONDS));
    this.drawBorderFlash(this.borderFlashNode, visible.width, visible.height, alpha);
  }

  private drawBorderFlash(node: Node, width: number, height: number, alpha: number): void {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    if (alpha <= 0) {
      return;
    }

    graphics.lineWidth = 18;
    graphics.strokeColor = new Color(255, 70, 70, alpha);
    graphics.rect(-width / 2 + 9, -height / 2 + 9, width - 18, height - 18);
    graphics.stroke();
  }

  private renderSpecialPickupIndicator(
    frame: ClientFrame,
    centerX: number,
    centerY: number,
    grantKind: "heal" | "magnet",
    indicatorNode: Node | null,
    fillColor: Readonly<Color>,
  ): void {
    if (!indicatorNode) {
      return;
    }

    const visible = view.getVisibleSize();
    const halfWorldWidth = visible.width / (2 * this.worldScale);
    const halfWorldHeight = visible.height / (2 * this.worldScale);

    let nearestPickup: ClientFrame["render"]["pickups"][number] | null = null;
    let nearestDistanceSq = Number.POSITIVE_INFINITY;
    for (const pickup of frame.render.pickups) {
      if (!pickup.visible || pickup.grantKind !== grantKind) {
        continue;
      }

      const dx = pickup.x - centerX;
      const dy = pickup.y - centerY;
      const isOnscreen = Math.abs(dx) <= halfWorldWidth && Math.abs(dy) <= halfWorldHeight;
      if (isOnscreen) {
        continue;
      }

      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < nearestDistanceSq) {
        nearestDistanceSq = distanceSq;
        nearestPickup = pickup;
      }
    }

    if (!nearestPickup) {
      indicatorNode.active = false;
      return;
    }

    const dx = nearestPickup.x - centerX;
    const dy = nearestPickup.y - centerY;
    const angle = Math.atan2(dy, dx);
    const margin = 52;
    const radiusX = visible.width / 2 - margin;
    const radiusY = visible.height / 2 - margin;
    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;

    indicatorNode.active = true;
    indicatorNode.setPosition(x, y, 0);
    this.drawPickupIndicator(indicatorNode, angle, fillColor);
  }

  private drawPickupIndicator(node: Node, angle: number, fillColor: Readonly<Color>): void {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(36, 36);
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(fillColor);
    graphics.strokeColor = new Color(255, 255, 255, 230);
    graphics.lineWidth = 2;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tipX = cos * 16;
    const tipY = sin * 16;
    const leftX = Math.cos(angle + 2.5) * 10;
    const leftY = Math.sin(angle + 2.5) * 10;
    const rightX = Math.cos(angle - 2.5) * 10;
    const rightY = Math.sin(angle - 2.5) * 10;

    graphics.moveTo(tipX, tipY);
    graphics.lineTo(leftX, leftY);
    graphics.lineTo(rightX, rightY);
    graphics.close();
    graphics.fill();
    graphics.stroke();
  }

  private applyScreenShake(): void {
    if (!this.worldLayer) {
      return;
    }

    if (this.screenShakeRemaining <= 0) {
      this.worldLayer.setPosition(0, 0, 0);
      return;
    }

    const intensity = this.screenShakeRemaining / SCREEN_SHAKE_SECONDS;
    const amplitude = SCREEN_SHAKE_AMPLITUDE * intensity;
    const offsetX = Math.sin(this.shakePhase * 1.7) * amplitude;
    const offsetY = Math.cos(this.shakePhase * 2.3) * amplitude * 0.8;
    this.worldLayer.setPosition(offsetX, offsetY, 0);
  }

  private loadPlayerFlashMaterial(): void {
    resources.load(PLAYER_FLASH_EFFECT_PATH, EffectAsset, (error, effectAsset) => {
      if (error || !effectAsset) {
        return;
      }

      const material = new Material();
      material.initialize({
        effectAsset,
      });
      material.setProperty("flashAmount", 0);
      this.playerFlashMaterial = material;
      this.applyPlayerFlashMaterial();
    });
  }

  private applyPlayerFlashMaterial(): void {
    if (!this.playerNode || !this.playerFlashMaterial) {
      return;
    }

    const sprite = this.playerNode.getComponent(Sprite);
    if (!sprite) {
      return;
    }

    sprite.customMaterial = this.playerFlashMaterial;
  }

  private syncPlayerFlashUniform(): void {
    if (!this.playerFlashMaterial) {
      return;
    }

    const intensity = Math.max(0, Math.min(1, this.playerHitFlashRemaining / PLAYER_HIT_FLASH_SECONDS));
    this.playerFlashMaterial.setProperty("flashAmount", intensity);
  }

  private createVisualNode(name: string, size: number): Node {
    const node = new Node(name);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(size, size);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    node.addComponent(Graphics);
    return node;
  }

  private createRingNode(name: string, color: Readonly<Color>, lineWidth: number): Node {
    const node = new Node(name);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(16, 16);
    const graphics = node.addComponent(Graphics);
    graphics.strokeColor = new Color(color);
    graphics.lineWidth = lineWidth;
    node.active = false;
    return node;
  }

  private drawRing(graphics: Graphics, transform: UITransform, radius: number, alpha: number): void {
    const color = new Color(graphics.strokeColor);
    color.a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
    graphics.clear();
    graphics.strokeColor = color;
    graphics.circle(0, 0, radius);
    graphics.stroke();
    transform.setContentSize(radius * 2 + 8, radius * 2 + 8);
  }

  private createLabelNode(name: string, fontSize: number, color: Readonly<Color>): Label {
    const node = new Node(name);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(1100, 360);
    transform.setAnchorPoint(0, 1);
    const label = node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.color = new Color(color);
    label.overflow = Label.Overflow.CLAMP;
    label.horizontalAlign = Label.HorizontalAlign.LEFT;
    label.verticalAlign = Label.VerticalAlign.TOP;
    return label;
  }
}
