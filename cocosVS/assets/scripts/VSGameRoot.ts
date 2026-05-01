import {
  _decorator,
  Canvas,
  Color,
  Component,
  Graphics,
  Node,
  Label,
  Sprite,
  UITransform,
  view,
} from "cc";
import { ClientSession } from "../vs-runtime/src/client/app/ClientSession.ts";
import type { ClientFrame } from "../vs-runtime/src/client/app/ClientFrame.ts";
import { loadPrototypeContentRegistry } from "../vs-runtime/src/sim/content/ContentLoader.ts";
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
  private hudLabel: Label | null = null;
  private overlayLabel: Label | null = null;
  private playerNode: Node | null = null;
  private auraNode: Node | null = null;
  private novaNode: Node | null = null;
  private latestMoveX = 0;
  private latestMoveY = 0;
  private enemyPool: CocosEntityPool<ClientFrame["render"]["enemies"][number]> | null = null;
  private projectilePool: CocosEntityPool<ClientFrame["render"]["projectiles"][number]> | null = null;
  private pickupPool: CocosEntityPool<ClientFrame["render"]["pickups"][number]> | null = null;

  protected onLoad(): void {
    this.ensureSceneNodes();
    this.inputState.enable();
    this.session.dispatch({
      type: "reset_run",
      seed: 1,
    });
    this.renderFrame(this.session.capture());
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
    this.renderFrame(frame);
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

    const gridNode = new Node("Grid");
    gridNode.parent = this.worldLayer;
    this.drawGrid(gridNode, visible.width, visible.height, 64);

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
  }

  private renderFrame(frame: ClientFrame): void {
    const centerX = this.followPlayer ? frame.camera.centerX : 0;
    const centerY = this.followPlayer ? frame.camera.centerY : 0;

    if (this.playerNode) {
      this.playerNode.active = frame.render.player.visible;
      this.sprites.apply(
        this.playerNode,
        frame.render.player.spriteKey,
        PLAYER_VISUAL_SIZE,
        frame.render.elapsedSeconds,
        new Color(255, 255, 255, 255),
      );
      this.playerNode.setPosition(
        (frame.render.player.x - centerX) * this.worldScale,
        (frame.render.player.y - centerY) * this.worldScale,
        0,
      );
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
        `CAM ${this.followPlayer ? "FOLLOW" : "FIXED"}`;
    }

    if (this.overlayLabel) {
      const lines: string[] = [];
      lines.push(`STATE: ${frame.runState.runState}`);
      if (frame.levelUp.visible) {
        lines.push(`LEVEL UP (${frame.levelUp.queuedLevelUps} queued)`);
        frame.levelUp.choices.forEach((choice, index) => {
          lines.push(`${index + 1}. ${choice.displayName} ${choice.currentLevel}->${choice.nextLevel}/${choice.maxLevel}`);
        });
      } else if (frame.runState.showGameOverOverlay) {
        lines.push("GAME OVER");
      } else {
        lines.push("Controls: WASD move, P pause, 1/2/3 choose, G XP, V wave");
        lines.push(`Player vel readout comes from position delta; camera is ${this.followPlayer ? "following" : "fixed"}`);
      }
      this.overlayLabel.string = lines.join("\n");
    }
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

  private drawGrid(node: Node, width: number, height: number, spacing: number): void {
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const graphics = node.addComponent(Graphics);
    graphics.lineWidth = 1;
    graphics.strokeColor = new Color(50, 64, 82, 255);

    for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x += spacing) {
      graphics.moveTo(x, -height / 2);
      graphics.lineTo(x, height / 2);
    }

    for (let y = -Math.floor(height / 2); y <= Math.floor(height / 2); y += spacing) {
      graphics.moveTo(-width / 2, y);
      graphics.lineTo(width / 2, y);
    }

    graphics.stroke();

    graphics.lineWidth = 2;
    graphics.strokeColor = new Color(90, 120, 160, 255);
    graphics.moveTo(-width / 2, 0);
    graphics.lineTo(width / 2, 0);
    graphics.moveTo(0, -height / 2);
    graphics.lineTo(0, height / 2);
    graphics.stroke();
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
    transform.setContentSize(1100, 220);
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
