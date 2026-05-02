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
  Texture2D,
  UITransform,
  view,
  resources,
} from "cc";
import { ClientSession } from "../vs-runtime/src/client/app/ClientSession.ts";
import type { ClientFrame } from "../vs-runtime/src/client/app/ClientFrame.ts";
import { loadPrototypeContentRegistry } from "../vs-runtime/src/sim/content/ContentLoader.ts";
import { DEFAULT_SIM_BOUNDS } from "../vs-runtime/src/sim/core/SimConfig.ts";
import { createSim } from "../vs-runtime/src/sim/core/Sim.ts";
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
const TERRAIN_OVERLAY_TILE_PATH = "tiles/field_tile_03_256";
const TERRAIN_OVERLAY_EFFECT_PATH = "effects/terrain_overlay";
const TERRAIN_CHUNK_WORLD_SIZE = 512;
const TERRAIN_CHUNK_RADIUS_X = 2;
const TERRAIN_CHUNK_RADIUS_Y = 2;
const TERRAIN_MASK_SCALE = 0.0011;
const TERRAIN_MASK_THRESHOLD = 0.46;
const TERRAIN_MASK_SOFTNESS = 0.26;
const TERRAIN_OVERLAY_OPACITY = 0.88;
const OUT_OF_BOUNDS_SHADE_ALPHA = 138;

interface TerrainChunkRuntime {
  readonly node: Node;
  readonly baseSprite: Sprite;
  readonly overlaySprite: Sprite;
  readonly overlayMaterial: Material;
  chunkX: number;
  chunkY: number;
}

@ccclass("VSGameRoot")
export class VSGameRoot extends Component {
  @property
  public worldScale = 2;

  @property
  public followPlayer = true;

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
  private terrainBaseTexture: Texture2D | null = null;
  private terrainOverlayTexture: Texture2D | null = null;
  private terrainBaseFrame: SpriteFrame | null = null;
  private terrainOverlayFrame: SpriteFrame | null = null;
  private terrainOverlayEffect: EffectAsset | null = null;
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
        lines.push("Controls: WASD move, P pause, 1/2/3 choose, G XP, V +10 mobs, I invuln");
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

      const texture = new Texture2D();
      texture.image = asset;
      this.terrainBaseTexture = texture;
      const frame = new SpriteFrame();
      frame.texture = texture;
      this.terrainBaseFrame = frame;
      this.refreshTerrainChunkAssets();
    });

    resources.load(TERRAIN_OVERLAY_TILE_PATH, ImageAsset, (error, asset) => {
      if (error || !asset) {
        return;
      }

      const texture = new Texture2D();
      texture.image = asset;
      this.terrainOverlayTexture = texture;
      const frame = new SpriteFrame();
      frame.texture = texture;
      this.terrainOverlayFrame = frame;
      this.refreshTerrainChunkAssets();
    });

    resources.load(TERRAIN_OVERLAY_EFFECT_PATH, EffectAsset, (error, effectAsset) => {
      if (error || !effectAsset) {
        return;
      }

      this.terrainOverlayEffect = effectAsset;
      this.refreshTerrainChunkAssets();
    });
  }

  private buildTerrainChunkRing(): void {
    if (!this.terrainLayer) {
      return;
    }

    const chunkRenderSize = TERRAIN_CHUNK_WORLD_SIZE * this.worldScale;
    for (let y = -TERRAIN_CHUNK_RADIUS_Y; y <= TERRAIN_CHUNK_RADIUS_Y; y += 1) {
      for (let x = -TERRAIN_CHUNK_RADIUS_X; x <= TERRAIN_CHUNK_RADIUS_X; x += 1) {
        const node = new Node(`TerrainChunk_${x}_${y}`);
        node.parent = this.terrainLayer;

        const baseNode = new Node("Base");
        baseNode.parent = node;
        const baseTransform = baseNode.addComponent(UITransform);
        baseTransform.setContentSize(chunkRenderSize, chunkRenderSize);
        const baseSprite = baseNode.addComponent(Sprite);
        baseSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        baseSprite.type = Sprite.Type.TILED;

        const overlayNode = new Node("Overlay");
        overlayNode.parent = node;
        const overlayTransform = overlayNode.addComponent(UITransform);
        overlayTransform.setContentSize(chunkRenderSize, chunkRenderSize);
        const overlaySprite = overlayNode.addComponent(Sprite);
        overlaySprite.sizeMode = Sprite.SizeMode.CUSTOM;
        overlaySprite.type = Sprite.Type.TILED;

        const overlayMaterial = new Material();
        this.terrainChunks.push({
          node,
          baseSprite,
          overlaySprite,
          overlayMaterial,
          chunkX: Number.NaN,
          chunkY: Number.NaN,
        });
      }
    }
  }

  private refreshTerrainChunkAssets(): void {
    if (!this.terrainBaseFrame || !this.terrainOverlayFrame || !this.terrainOverlayEffect) {
      return;
    }

    for (const chunk of this.terrainChunks) {
      chunk.baseSprite.spriteFrame = this.terrainBaseFrame;
      chunk.overlaySprite.spriteFrame = this.terrainOverlayFrame;
      chunk.baseSprite.color = new Color(255, 255, 255, 255);
      chunk.overlayMaterial.initialize({
        effectAsset: this.terrainOverlayEffect,
      });
      chunk.overlayMaterial.setProperty("maskScale", TERRAIN_MASK_SCALE);
      chunk.overlayMaterial.setProperty("maskThreshold", TERRAIN_MASK_THRESHOLD);
      chunk.overlayMaterial.setProperty("maskSoftness", TERRAIN_MASK_SOFTNESS);
      chunk.overlayMaterial.setProperty("overlayOpacity", TERRAIN_OVERLAY_OPACITY);
      chunk.overlayMaterial.setProperty("invWorldScale", 1 / this.worldScale);
      chunk.overlayMaterial.setProperty("chunkSize", [
        TERRAIN_CHUNK_WORLD_SIZE * this.worldScale,
        TERRAIN_CHUNK_WORLD_SIZE * this.worldScale,
      ]);
      chunk.overlaySprite.customMaterial = chunk.overlayMaterial;
    }
  }

  private updateTerrainChunks(centerX: number, centerY: number): void {
    if (this.terrainChunks.length === 0) {
      return;
    }

    const cameraChunkX = Math.floor(centerX / TERRAIN_CHUNK_WORLD_SIZE);
    const cameraChunkY = Math.floor(centerY / TERRAIN_CHUNK_WORLD_SIZE);
    let chunkIndex = 0;
    for (let offsetY = -TERRAIN_CHUNK_RADIUS_Y; offsetY <= TERRAIN_CHUNK_RADIUS_Y; offsetY += 1) {
      for (let offsetX = -TERRAIN_CHUNK_RADIUS_X; offsetX <= TERRAIN_CHUNK_RADIUS_X; offsetX += 1) {
        const chunk = this.terrainChunks[chunkIndex];
        chunkIndex += 1;
        const chunkX = cameraChunkX + offsetX;
        const chunkY = cameraChunkY + offsetY;
        if (chunk.chunkX !== chunkX || chunk.chunkY !== chunkY) {
          chunk.chunkX = chunkX;
          chunk.chunkY = chunkY;
          chunk.overlayMaterial.setProperty("chunkOrigin", [
            (chunkX * TERRAIN_CHUNK_WORLD_SIZE + TERRAIN_CHUNK_WORLD_SIZE * 0.5) * this.worldScale,
            (chunkY * TERRAIN_CHUNK_WORLD_SIZE + TERRAIN_CHUNK_WORLD_SIZE * 0.5) * this.worldScale,
          ]);
        }

        chunk.node.setPosition(
          (chunkX * TERRAIN_CHUNK_WORLD_SIZE - centerX + TERRAIN_CHUNK_WORLD_SIZE * 0.5) * this.worldScale,
          (chunkY * TERRAIN_CHUNK_WORLD_SIZE - centerY + TERRAIN_CHUNK_WORLD_SIZE * 0.5) * this.worldScale,
          0,
        );
      }
    }
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
