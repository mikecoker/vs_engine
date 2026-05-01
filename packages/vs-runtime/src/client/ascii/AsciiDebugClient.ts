import type { SimApi, SimContent } from "../../sim/core/SimApi";
import type { ClientFrame } from "../app/ClientFrame";
import type { ClientInputSource } from "../input/ClientInputSource";
import { ClientSession } from "../app/ClientSession";
import { formatAsciiFrame } from "./AsciiFormatter";
import type { AsciiViewport } from "./AsciiViewport";

export class AsciiDebugClient {
  private readonly session: ClientSession;

  public constructor(
    sim: SimApi,
    content: SimContent,
    private readonly viewport: AsciiViewport,
  ) {
    this.session = new ClientSession(sim, content);
  }

  public captureFrame(): ClientFrame {
    return this.session.capture();
  }

  public captureString(): string {
    return formatAsciiFrame(this.captureFrame(), this.viewport);
  }

  public formatFrame(frame: ClientFrame): string {
    return formatAsciiFrame(frame, this.viewport);
  }

  public resetRunFrame(seed?: number): ClientFrame {
    return this.session.dispatch({
      type: "reset_run",
      seed,
    });
  }

  public resetRun(seed?: number): string {
    return this.formatFrame(this.resetRunFrame(seed));
  }

  public stepFrame(frameSeconds: number, input: Readonly<ClientInputSource>): ClientFrame {
    return this.session.step(frameSeconds, input);
  }

  public stepToString(frameSeconds: number, input: Readonly<ClientInputSource>): string {
    return this.formatFrame(this.stepFrame(frameSeconds, input));
  }

  public selectUpgradeFrame(choiceIndex: number): ClientFrame {
    return this.session.dispatch({
      type: "select_upgrade",
      choiceIndex,
    });
  }

  public selectUpgradeToString(choiceIndex: number): string {
    return this.formatFrame(this.selectUpgradeFrame(choiceIndex));
  }
}
