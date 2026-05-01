import type { DebugViewModel } from "../ui/DebugPresenter";
import type { PresentedRenderFrame } from "../render/RenderPresenter";
import type { HudViewModel } from "../ui/HudPresenter";
import type { LevelUpViewModel } from "../ui/LevelUpPresenter";
import type { RunStateViewModel } from "../ui/RunStatePresenter";
import type { CameraViewModel } from "../scene/CameraPresenter";

export interface ClientFrame {
  readonly render: PresentedRenderFrame;
  readonly hud: HudViewModel;
  readonly runState: RunStateViewModel;
  readonly levelUp: LevelUpViewModel;
  readonly camera: CameraViewModel;
  readonly debug: DebugViewModel;
}
