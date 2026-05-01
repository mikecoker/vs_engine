import {
  _decorator,
  Canvas,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  UITransform,
  view,
} from "cc";
import { ClientSession } from "../shared/src/client/app/ClientSession";
import type { ClientFrame } from "../shared/src/client/app/ClientFrame";
import { loadPrototypeContentRegistry } from "../shared/src/sim/content/ContentLoader";
import { createSim } from "../shared/src/sim/core/Sim";
import { CocosEntityPool } from "./CocosEntityPool";
import { CocosInputState } from "./CocosInputState";

const { ccclass, property } = _decorator;

@ccclass("VSGameRoot")
export class VSGameRoot extends Component {
  @property
  public worldScale = 1;

  private readonly inputState = new CocosInputState();
  private readonly content = loadPrototypeContentRegistry();
  private readonly sim = createSim({}, this.content, 1);
  private readonly session = new ClientSession(this.sim, this.content);

  private worldLayer: Node | null = null;
  private hudLabel: Label | null = null;
  private overlayLabel: Label | null = null;
  private playerNode: Node | null = null;
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

    const frame = this.session.step(dt, this.inputState.toClientInput());
    this.renderFrame(frame);
  }

  private ensureSceneNodes(): void {
    const canvasNode = this.getComponent(Canvas)?.node ?? this.node;
    const canvasTransform = canvasNode.getComponent(UITransform) ?? canvasNode.addComponent(UITransform);
    const visible = view.getVisibleSize();
    canvasTransform.setContentSize(visible.width, visible.height);

    this.worldLayer = new Node("WorldLayer");
    this.worldLayer.parent = canvasNode;

    this.playerNode = this.createCircleNode("Player", new Color(255, 255, 255, 255), 10);
    this.playerNode.parent = this.worldLayer;

    this.enemyPool = new CocosEntityPool(this.worldLayer, new Color(220, 80, 80, 255), 8);
    this.projectilePool = new CocosEntityPool(this.worldLayer, new Color(255, 220, 80, 255), 4);
    this.pickupPool = new CocosEntityPool(this.worldLayer, new Color(80, 220, 120, 255), 5);

    this.hudLabel = this.createLabelNode("Hud", 18, new Color(255, 255, 255, 255));
    this.hudLabel.node.parent = canvasNode;
    this.hudLabel.node.setPosition(-visible.width / 2 + 20, visible.height / 2 - 24, 0);

    this.overlayLabel = this.createLabelNode("Overlay", 20, new Color(255, 235, 160, 255));
    this.overlayLabel.node.parent = canvasNode;
    this.overlayLabel.node.setPosition(-visible.width / 2 + 20, visible.height / 2 - 80, 0);
  }

  private renderFrame(frame: ClientFrame): void {
    const centerX = frame.camera.centerX;
    const centerY = frame.camera.centerY;

    if (this.playerNode) {
      this.playerNode.active = frame.render.player.visible;
      this.playerNode.setPosition(
        (frame.render.player.x - centerX) * this.worldScale,
        (frame.render.player.y - centerY) * this.worldScale,
        0,
      );
    }

    this.enemyPool?.sync(frame.render.enemies, centerX, centerY, this.worldScale);
    this.projectilePool?.sync(frame.render.projectiles, centerX, centerY, this.worldScale);
    this.pickupPool?.sync(frame.render.pickups, centerX, centerY, this.worldScale);

    if (this.hudLabel) {
      this.hudLabel.string =
        `HP ${Math.round(frame.hud.hp)}/${Math.round(frame.hud.maxHp)}  ` +
        `LV ${frame.hud.level}  XP ${frame.hud.xp}/${frame.hud.xpToNext}  ` +
        `EN ${frame.debug.activeEnemyCount}  PR ${frame.debug.activeProjectileCount}  ` +
        `PU ${frame.debug.activePickupCount}`;
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
      }
      this.overlayLabel.string = lines.join("\n");
    }
  }

  private createCircleNode(name: string, color: Readonly<Color>, radius: number): Node {
    const node = new Node(name);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(radius * 2, radius * 2);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(color);
    graphics.circle(0, 0, radius);
    graphics.fill();
    return node;
  }

  private createLabelNode(name: string, fontSize: number, color: Readonly<Color>): Label {
    const node = new Node(name);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(900, 160);
    const label = node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.color = new Color(color);
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = Label.HorizontalAlign.LEFT;
    label.verticalAlign = Label.VerticalAlign.TOP;
    return label;
  }
}
