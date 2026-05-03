import type { PlayerRenderSnapshot } from "../../sim/core/RenderSnapshot.ts";

export interface CameraViewModel {
  readonly centerX: number;
  readonly centerY: number;
  readonly zoom: number;
}

export function presentCamera(player: PlayerRenderSnapshot, zoom = 1): CameraViewModel {
  return {
    centerX: player.x,
    centerY: player.y,
    zoom,
  };
}
