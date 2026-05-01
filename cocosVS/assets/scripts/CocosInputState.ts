import { EventKeyboard, Input, KeyCode, input } from "cc";
import type { ClientInputSource } from "../shared/src/client/input/ClientInputSource.ts";

export class CocosInputState {
  private readonly held = new Set<KeyCode>();
  private pausePressed = false;
  private confirmPressed = false;
  private cancelPressed = false;
  private debugGrantXpPressed = false;
  private debugSpawnWavePressed = false;
  private pendingUpgradeChoice: number | null = null;

  public enable(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  public disable(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    this.held.clear();
  }

  public consumeUpgradeChoice(): number | null {
    const choice = this.pendingUpgradeChoice;
    this.pendingUpgradeChoice = null;
    return choice;
  }

  public toClientInput(): ClientInputSource {
    const moveX = (this.held.has(KeyCode.KEY_D) ? 1 : 0) + (this.held.has(KeyCode.KEY_A) ? -1 : 0);
    const moveY = (this.held.has(KeyCode.KEY_S) ? -1 : 0) + (this.held.has(KeyCode.KEY_W) ? 1 : 0);

    const payload: ClientInputSource = {
      moveX,
      moveY,
      pausePressed: this.pausePressed,
      confirmPressed: this.confirmPressed,
      cancelPressed: this.cancelPressed,
      debugGrantXpPressed: this.debugGrantXpPressed,
      debugSpawnWavePressed: this.debugSpawnWavePressed,
    };

    this.pausePressed = false;
    this.confirmPressed = false;
    this.cancelPressed = false;
    this.debugGrantXpPressed = false;
    this.debugSpawnWavePressed = false;
    return payload;
  }

  private onKeyDown(event: EventKeyboard): void {
    this.held.add(event.keyCode);

    switch (event.keyCode) {
      case KeyCode.KEY_P:
        this.pausePressed = true;
        break;
      case KeyCode.ENTER:
      case KeyCode.SPACE:
        this.confirmPressed = true;
        break;
      case KeyCode.ESCAPE:
        this.cancelPressed = true;
        break;
      case KeyCode.KEY_G:
        this.debugGrantXpPressed = true;
        break;
      case KeyCode.KEY_V:
        this.debugSpawnWavePressed = true;
        break;
      case KeyCode.DIGIT_1:
        this.pendingUpgradeChoice = 0;
        break;
      case KeyCode.DIGIT_2:
        this.pendingUpgradeChoice = 1;
        break;
      case KeyCode.DIGIT_3:
        this.pendingUpgradeChoice = 2;
        break;
      default:
        break;
    }
  }

  private onKeyUp(event: EventKeyboard): void {
    this.held.delete(event.keyCode);
  }
}
