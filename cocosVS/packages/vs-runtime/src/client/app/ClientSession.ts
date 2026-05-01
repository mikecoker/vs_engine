import type { SimApi, SimContent } from "../../sim/core/SimApi";
import { RenderPresenter } from "../render/RenderPresenter";
import { presentHud } from "../ui/HudPresenter";
import { presentLevelUp } from "../ui/LevelUpPresenter";
import { presentRunState } from "../ui/RunStatePresenter";
import { presentCamera } from "../scene/CameraPresenter";
import { presentDebug } from "../ui/DebugPresenter";
import { adaptCocosInput } from "../input/CocosInputAdapter";
import type { ClientInputSource } from "../input/ClientInputSource";
import type { ClientFrame } from "./ClientFrame";
import type { ClientAction } from "./ClientActions";

export class ClientSession {
  private readonly renderPresenter: RenderPresenter;

  public constructor(
    private readonly sim: SimApi,
    content: SimContent = {},
  ) {
    this.renderPresenter = new RenderPresenter(content);
  }

  public dispatch(action: ClientAction): ClientFrame {
    switch (action.type) {
      case "step":
        this.sim.step(action.frameSeconds, adaptCocosInput(action.input));
        return this.capture();
      case "capture":
        return this.capture();
      case "reset_run":
        this.sim.resetRun(action.seed);
        return this.capture();
      case "select_upgrade":
        this.sim.selectUpgrade(action.choiceIndex);
        return this.capture();
      default: {
        const exhaustive: never = action;
        throw new Error(`Unhandled client action: ${String(exhaustive)}`);
      }
    }
  }

  public step(frameSeconds: number, input: Readonly<ClientInputSource>): ClientFrame {
    return this.dispatch({
      type: "step",
      frameSeconds,
      input,
    });
  }

  public capture(): ClientFrame {
    const snapshot = this.sim.getRenderSnapshot();
    const levelUpPayload = this.sim.getLevelUpPayload();
    const debugSnapshot = this.sim.getDebugSnapshot();

    return {
      render: this.renderPresenter.present(snapshot),
      hud: presentHud(snapshot.player, snapshot.progression, snapshot.elapsedSeconds),
      runState: presentRunState(snapshot.runState),
      levelUp: presentLevelUp(levelUpPayload),
      camera: presentCamera(snapshot.player),
      debug: presentDebug(debugSnapshot),
    };
  }

  public getSim(): SimApi {
    return this.sim;
  }
}
