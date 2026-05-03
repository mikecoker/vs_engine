import type { SimApi } from "../../sim/core/SimApi.ts";
import type { SimContent } from "../../sim/core/SimApi.ts";
import type { CocosInputSource } from "../input/CocosInputAdapter.ts";
import { ClientSession } from "../app/ClientSession.ts";
import type { ClientFrame } from "../app/ClientFrame.ts";

export interface SimSceneFrame extends ClientFrame {}

export class SimSceneBridge {
  private readonly session: ClientSession;

  public constructor(
    private readonly sim: SimApi,
    content: SimContent = {},
  ) {
    this.session = new ClientSession(sim, content);
  }

  public step(frameSeconds: number, inputSource: Readonly<CocosInputSource>): SimSceneFrame {
    return this.session.step(frameSeconds, inputSource);
  }

  public captureFrame(): SimSceneFrame {
    return this.session.capture();
  }

  public resetRun(seed?: number): SimSceneFrame {
    return this.session.dispatch({
      type: "reset_run",
      seed,
    });
  }

  public selectUpgrade(choiceIndex: number): SimSceneFrame {
    return this.session.dispatch({
      type: "select_upgrade",
      choiceIndex,
    });
  }

  public getSim(): SimApi {
    return this.sim;
  }
}
