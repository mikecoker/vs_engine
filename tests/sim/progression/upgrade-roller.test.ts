import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { initializePlayerForRun } from "../../../src/sim/player/PlayerReset";
import { rollUpgradeChoices } from "../../../src/sim/progression/UpgradeRoller";
import { ensureProgressionStore } from "../../../src/sim/progression/ProgressionStore";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { RunState } from "../../../src/sim/core/RunState";
import { createWorld } from "../../../src/sim/world/World";

test("upgrade roller filters exhausted upgrades", () => {
  const content = loadPrototypeContentRegistry();
  const world = createWorld(mergeSimConfig(), content, RunState.Running, 17);
  initializePlayerForRun(world.stores.player, content);

  const progression = ensureProgressionStore(world);
  progression.passiveUpgradeLevels.fill(5);

  const choices = rollUpgradeChoices(world, progression);

  assert.ok(choices.length > 0);
  for (let index = 0; index < choices.length; index += 1) {
    const choice = choices[index];
    assert.notEqual(choice.kind, "passive");
  }
});

test("upgrade roller emits only valid unique choices", () => {
  const content = loadPrototypeContentRegistry();
  const world = createWorld(mergeSimConfig(), content, RunState.Running, 29);
  initializePlayerForRun(world.stores.player, content);

  const progression = ensureProgressionStore(world);
  const choices = rollUpgradeChoices(world, progression);
  const ids = new Set<string>();

  assert.ok(choices.length > 0);
  assert.ok(choices.length <= 3);
  for (let index = 0; index < choices.length; index += 1) {
    const choice = choices[index];
    assert.ok(choice.nextLevel <= choice.maxLevel);
    assert.equal(ids.has(choice.choiceId), false);
    ids.add(choice.choiceId);
  }
});
