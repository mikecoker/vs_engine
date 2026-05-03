import type { ClientFrame } from "../app/ClientFrame.ts";
import { renderAsciiFrame } from "./AsciiRenderer.ts";
import type { AsciiViewport } from "./AsciiViewport.ts";

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function formatAsciiFrame(frame: ClientFrame, viewport: AsciiViewport): string {
  const ascii = renderAsciiFrame(frame, viewport);
  const lines: string[] = [];

  lines.push(
    `HP ${frame.hud.hp.toFixed(0)}/${frame.hud.maxHp.toFixed(0)}  LV ${frame.hud.level}  XP ${frame.hud.xp}/${frame.hud.xpToNext}  TIME ${formatTime(frame.hud.elapsedSeconds)}`,
  );
  lines.push(
    `STATE ${frame.runState.runState}  EN ${frame.debug.activeEnemyCount}  PR ${frame.debug.activeProjectileCount}  PU ${frame.debug.activePickupCount}  TICK ${frame.debug.tick}`,
  );

  if (frame.levelUp.visible) {
    lines.push(`LEVEL UP (${frame.levelUp.queuedLevelUps} queued)`);
    frame.levelUp.choices.forEach((choice, index) => {
      lines.push(
        `  ${index + 1}. ${choice.displayName} [${choice.currentLevel}->${choice.nextLevel}/${choice.maxLevel}]`,
      );
    });
  }

  lines.push(...ascii.rows);
  return lines.join("\n");
}
