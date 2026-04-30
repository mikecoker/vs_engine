import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import {
  applyPlayerStatModifiers,
  createPlayerStore,
  initializePlayerForRun,
  rebuildPlayerRuntimeStats,
} from "../../../src/sim/player/PlayerApi";

test("player reset initializes from prototype content", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();

  initializePlayerForRun(player, content);

  assert.equal(player.exists, true);
  assert.equal(player.characterId, "player.witch");
  assert.equal(player.maxHp, 100);
  assert.equal(player.statSnapshot.moveSpeed, 160);
  assert.equal(player.pickupRadius, 40);
  assert.equal(player.hp, 100);
});

test("player stat snapshot rebuild reflects additive and multiplicative modifiers", () => {
  const content = loadPrototypeContentRegistry();
  const player = createPlayerStore();

  initializePlayerForRun(player, content);
  player.hp = 50;

  applyPlayerStatModifiers(player.statModifiers, [
    { stat: "maxHp", mode: "add", value: 20 },
    { stat: "moveSpeed", mode: "mul", value: 1.5 },
    { stat: "projectileCount", mode: "add", value: 2 },
    { stat: "pickupRadius", mode: "mul", value: 2 },
  ]);
  rebuildPlayerRuntimeStats(player);

  assert.equal(player.maxHp, 120);
  assert.equal(player.hp, 60);
  assert.equal(player.statSnapshot.moveSpeed, 240);
  assert.equal(player.statSnapshot.projectileCount, 3);
  assert.equal(player.pickupRadius, 80);
});
