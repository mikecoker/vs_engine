import type { ClientFrame } from "../app/ClientFrame";
import { DEFAULT_ASCII_PALETTE, type AsciiPalette } from "./AsciiPalette";
import { worldToGrid, type AsciiViewport } from "./AsciiViewport";

export interface AsciiRenderResult {
  readonly rows: readonly string[];
}

function createGrid(width: number, height: number, fill: string): string[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

function writeCell(grid: string[][], col: number, row: number, value: string): void {
  if (row < 0 || row >= grid.length) {
    return;
  }

  const line = grid[row];
  if (col < 0 || col >= line.length) {
    return;
  }

  line[col] = value;
}

export function renderAsciiFrame(
  frame: ClientFrame,
  viewport: AsciiViewport,
  palette: AsciiPalette = DEFAULT_ASCII_PALETTE,
): AsciiRenderResult {
  const grid = createGrid(viewport.width, viewport.height, palette.empty);
  const camera = frame.camera;

  for (const pickup of frame.render.pickups) {
    if (!pickup.visible) {
      continue;
    }
    const point = worldToGrid(viewport, camera, pickup.x, pickup.y);
    if (point) {
      writeCell(grid, point.col, point.row, palette.pickup);
    }
  }

  for (const projectile of frame.render.projectiles) {
    if (!projectile.visible) {
      continue;
    }
    const point = worldToGrid(viewport, camera, projectile.x, projectile.y);
    if (point) {
      writeCell(grid, point.col, point.row, palette.projectile);
    }
  }

  for (const enemy of frame.render.enemies) {
    if (!enemy.visible) {
      continue;
    }
    const point = worldToGrid(viewport, camera, enemy.x, enemy.y);
    if (point) {
      writeCell(grid, point.col, point.row, palette.enemy);
    }
  }

  if (frame.render.player.visible) {
    const point = worldToGrid(
      viewport,
      camera,
      frame.render.player.x,
      frame.render.player.y,
    );
    if (point) {
      writeCell(grid, point.col, point.row, palette.player);
    }
  }

  return {
    rows: grid.map((row) => row.join("")),
  };
}
