import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import type { FrameContext } from "@vs-engine/runtime/src/sim/core/FrameContext";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { DamageBuffer } from "@vs-engine/runtime/src/sim/core/commands/DamageBuffer";
import { StateChangeBuffer } from "@vs-engine/runtime/src/sim/core/commands/StateChangeBuffer";
import {
  applyDamageToPlayer,
  createPlayerStore,
  initializePlayerForRun,
  stepPlayerDamageSystem,
  tickPlayerInvulnerability,
} from "@vs-engine/runtime/src/sim/player/PlayerApi";

test("damage intake reduces hp and invulnerability blocks repeated immediate hits", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();
  initializePlayerForRun(player, content);

  const firstHit = applyDamageToPlayer(player, 10, "contact");
  const secondHit = applyDamageToPlayer(player, 10, "contact");

  assert.equal(firstHit.applied, true);
  assert.equal(player.hp, 90);
  assert.equal(secondHit.applied, false);

  tickPlayerInvulnerability(player, player.invulnerabilityDurationSeconds);

  const thirdHit = applyDamageToPlayer(player, 10, "contact");
  assert.equal(thirdHit.applied, true);
  assert.equal(player.hp, 80);
});

test("player damage system queues game over when lethal damage resolves", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();
  initializePlayerForRun(player, content);

  const damage = new DamageBuffer();
  damage.enqueue("player", 0, 999, "debug", -1);
  damage.enqueue("enemy", 1, 5, "debug", -1);

  const stateChange = new StateChangeBuffer();

  const context = {
    dt: 1 / 60,
    tick: 1,
    elapsedSeconds: 1 / 60,
    frameInput: {
      moveX: 0,
      moveY: 0,
      pausePressed: false,
      confirmPressed: false,
      cancelPressed: false,
    },
    config: {
      fixedStepSeconds: 1 / 60,
      maxSubstepsPerFrame: 5,
      maxFrameSeconds: 0.25,
      initialRunState: RunState.Running,
      capacities: {
        enemies: 1,
        projectiles: 1,
        pickups: 1,
        commandBuffer: 2,
      },
    },
    world: {
      stores: { player },
      commands: { damage, stateChange },
    },
  } as FrameContext;

  stepPlayerDamageSystem(context);

  assert.equal(player.isDead, true);
  assert.equal(player.hp, 0);
  assert.equal(stateChange.count, 1);
  assert.equal(stateChange.get(0).nextState, RunState.GameOver);
  assert.equal(damage.count, 1);
  assert.equal(damage.get(0).targetKind, "enemy");
});

test("debug invulnerable bypasses incoming damage", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();
  initializePlayerForRun(player, content);
  player.debugInvulnerable = true;

  const result = applyDamageToPlayer(player, 25, "contact");

  assert.equal(result.applied, false);
  assert.equal(player.hp, player.maxHp);
  assert.equal(player.isDead, false);
});
