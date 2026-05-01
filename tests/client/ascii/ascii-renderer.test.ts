import assert from "node:assert/strict";
import test from "node:test";

import { renderAsciiFrame } from "../../../src/client/ascii/AsciiRenderer";
import type { ClientFrame } from "../../../src/client/app/ClientFrame";

function createFrame(): ClientFrame {
  return {
    render: {
      elapsedSeconds: 5,
      player: {
        key: "player",
        visible: true,
        spriteKey: "player_witch",
        x: 0,
        y: 0,
        hp: 10,
        maxHp: 10,
      },
      enemies: [
        {
          key: "enemy:0",
          visible: true,
          x: 16,
          y: 0,
          typeId: 0,
          spriteKey: "enemy_bat",
          displayName: "Bat",
        },
      ],
      projectiles: [
        {
          key: "projectile:0",
          visible: true,
          x: -16,
          y: 0,
          typeId: 0,
          spriteKey: "projectile_magic_bolt",
          displayName: "Magic Bolt",
        },
      ],
      pickups: [
        {
          key: "pickup:0",
          visible: true,
          x: 0,
          y: 16,
          typeId: 0,
          spriteKey: "pickup_xp_small",
          displayName: "Small XP Gem",
        },
      ],
      weaponEffects: [],
    },
    hud: {
      hp: 10,
      maxHp: 10,
      level: 1,
      xp: 0,
      xpToNext: 5,
      elapsedSeconds: 5,
    },
    runState: {
      runState: "running",
      showPauseOverlay: false,
      showLevelUpOverlay: false,
      showGameOverOverlay: false,
    },
    levelUp: {
      visible: false,
      level: 0,
      xp: 0,
      xpToNext: 0,
      queuedLevelUps: 0,
      choices: [],
    },
    camera: {
      centerX: 0,
      centerY: 0,
      zoom: 1,
    },
    debug: {
      tick: 1,
      gameplayTicks: 1,
      activeEnemyCount: 1,
      activeProjectileCount: 1,
      activePickupCount: 1,
      droppedFrameSubsteps: 0,
      lastRunStateChangeReason: "test",
    },
  };
}

test("renderAsciiFrame draws layered glyphs into the viewport", () => {
  const result = renderAsciiFrame(createFrame(), {
    width: 5,
    height: 5,
    worldUnitsPerCell: 16,
  });

  assert.equal(result.rows[2], ".*@e.");
  assert.equal(result.rows[3], "..x..");
});
