import type { CameraViewModel } from "../scene/CameraPresenter.ts";

export interface AsciiViewport {
  readonly width: number;
  readonly height: number;
  readonly worldUnitsPerCell: number;
}

export interface AsciiGridPoint {
  readonly col: number;
  readonly row: number;
}

export function worldToGrid(
  viewport: AsciiViewport,
  camera: CameraViewModel,
  x: number,
  y: number,
): AsciiGridPoint | null {
  const halfWidth = viewport.width / 2;
  const halfHeight = viewport.height / 2;

  const localX = (x - camera.centerX) / viewport.worldUnitsPerCell;
  const localY = (y - camera.centerY) / viewport.worldUnitsPerCell;

  const col = Math.floor(halfWidth + localX);
  const row = Math.floor(halfHeight + localY);

  if (col < 0 || col >= viewport.width || row < 0 || row >= viewport.height) {
    return null;
  }

  return { col, row };
}
