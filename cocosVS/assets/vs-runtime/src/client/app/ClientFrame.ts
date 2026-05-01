import type { DebugViewModel } from "../ui/DebugPresenter.ts";
import type { PresentedRenderFrame } from "../render/RenderPresenter.ts";
import type { HudViewModel } from "../ui/HudPresenter.ts";
import type { LevelUpViewModel } from "../ui/LevelUpPresenter.ts";
import type { RunStateViewModel } from "../ui/RunStatePresenter.ts";
import type { CameraViewModel } from "../scene/CameraPresenter.ts";

export interface ClientFrame {
  readonly render: PresentedRenderFrame;
  readonly hud: HudViewModel;
  readonly runState: RunStateViewModel;
  readonly levelUp: LevelUpViewModel;
  readonly camera: CameraViewModel;
  readonly debug: DebugViewModel;
}
