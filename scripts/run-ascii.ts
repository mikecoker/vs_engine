import readline from "node:readline";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import { createSim } from "@vs-engine/runtime/src/sim/core/Sim";
import { AsciiDebugClient } from "@vs-engine/runtime/src/client/ascii/AsciiDebugClient";
import type { ClientInputSource } from "@vs-engine/runtime/src/client/input/ClientInputSource";
import type { ClientFrame } from "@vs-engine/runtime/src/client/app/ClientFrame";

const content = loadPrototypeContentRegistry();
const sim = createSim({}, content, 1);
const client = new AsciiDebugClient(sim, content, {
  width: 80,
  height: 24,
  worldUnitsPerCell: 16,
});

function renderFrame(frame: ClientFrame): void {
  const help = [
    "Controls: w/a/s/d move, x stop, p pause, r reset, 1/2/3 choose upgrade, q quit",
    "",
  ].join("\n");
  process.stdout.write("\x1bc");
  process.stdout.write(help);
  process.stdout.write(client.formatFrame(frame));
  process.stdout.write("\n");
}

function runDump(totalSteps: number): void {
  const resetFrame = client.resetRunFrame(1);
  process.stdout.write(client.formatFrame(resetFrame));
  process.stdout.write("\n");

  for (let step = 0; step < totalSteps; step += 1) {
    const moveX = step % 120 < 60 ? 1 : -1;
    const moveY = step % 90 < 45 ? 0.25 : -0.25;
    const frame = client.stepFrame(1 / 60, {
      moveX,
      moveY,
    });

    if ((step + 1) % 30 === 0 || step === totalSteps - 1) {
      process.stdout.write(`\nFRAME ${step + 1}\n`);
      process.stdout.write(client.formatFrame(frame));
      process.stdout.write("\n");
    }
  }
}

function runInteractive(): void {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const directionalState = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  };
  const KEY_HELD_TIMEOUT_MS = 140;
  let pausePressed = false;
  let confirmPressed = false;
  let cancelPressed = false;
  let debugGrantXpPressed = false;
  let debugSpawnWavePressed = false;
  let running = true;

  function nowMs(): number {
    return Date.now();
  }

  function markDirection(name: "up" | "down" | "left" | "right"): void {
    directionalState[name] = nowMs();
  }

  function getDirectionalAxis(lastTimestamp: number): boolean {
    return lastTimestamp > 0 && nowMs() - lastTimestamp <= KEY_HELD_TIMEOUT_MS;
  }

  function resolveMovement(): { moveX: number; moveY: number } {
    const up = getDirectionalAxis(directionalState.up);
    const down = getDirectionalAxis(directionalState.down);
    const left = getDirectionalAxis(directionalState.left);
    const right = getDirectionalAxis(directionalState.right);

    return {
      moveX: (right ? 1 : 0) + (left ? -1 : 0),
      moveY: (down ? 1 : 0) + (up ? -1 : 0),
    };
  }

  function stop(exitCode = 0): void {
    running = false;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.removeAllListeners("keypress");
    process.stdout.write("\n");
    process.exit(exitCode);
  }

  process.stdin.on("keypress", (_str, key) => {
    if (key.sequence === "\u0003" || key.name === "q") {
      stop(0);
      return;
    }

    switch (key.name) {
      case "w":
        markDirection("up");
        return;
      case "a":
        markDirection("left");
        return;
      case "s":
        markDirection("down");
        return;
      case "d":
        markDirection("right");
        return;
      case "p":
        pausePressed = true;
        return;
      case "r": {
        const frame = client.resetRunFrame(1);
        renderFrame(frame);
        return;
      }
      case "g":
        debugGrantXpPressed = true;
        return;
      case "v":
        debugSpawnWavePressed = true;
        return;
      case "1":
      case "2":
      case "3": {
        const frame = client.selectUpgradeFrame(Number(key.name) - 1);
        renderFrame(frame);
        return;
      }
      case "return":
      case "space":
        confirmPressed = true;
        return;
      case "escape":
        cancelPressed = true;
        return;
      default:
        return;
    }
  });

  function buildInput(): ClientInputSource {
    const movement = resolveMovement();
    const input = {
      moveX: movement.moveX,
      moveY: movement.moveY,
      pausePressed,
      confirmPressed,
      cancelPressed,
      debugGrantXpPressed,
      debugSpawnWavePressed,
    };
    pausePressed = false;
    confirmPressed = false;
    cancelPressed = false;
    debugGrantXpPressed = false;
    debugSpawnWavePressed = false;
    return input;
  }

  let frame = client.resetRunFrame(1);
  renderFrame(frame);

  const interval = setInterval(() => {
    if (!running) {
      clearInterval(interval);
      return;
    }

    frame = client.stepFrame(1 / 30, buildInput());
    renderFrame(frame);

    if (frame.runState.showGameOverOverlay) {
      clearInterval(interval);
      process.stdout.write("\nGame over. Press q to quit.\n");
      stop(0);
    }
  }, 33);
}

const args = process.argv.slice(2);
if (args[0] === "--dump") {
  runDump(Number(args[1] ?? 180));
} else {
  runInteractive();
}
