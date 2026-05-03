import assert from "node:assert/strict";
import test from "node:test";

import { ensureWeaponRuntimeStore } from "@vs-engine/runtime/src/sim/combat/WeaponRuntimeStore";
import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import { initializePlayerForRun } from "@vs-engine/runtime/src/sim/player/PlayerReset";
import { rollUpgradeChoices } from "@vs-engine/runtime/src/sim/progression/UpgradeRoller";
import { ensureProgressionStore } from "@vs-engine/runtime/src/sim/progression/ProgressionStore";
import { mergeSimConfig } from "@vs-engine/runtime/src/sim/core/SimConfig";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import { createWorld } from "@vs-engine/runtime/src/sim/world/World";

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

test("upgrade roller filters maxed weapon level choices", () => {
  const content = loadPrototypeContentRegistry();
  const world = createWorld(mergeSimConfig(), content, RunState.Running, 23);
  initializePlayerForRun(world.stores.player, content);

  const progression = ensureProgressionStore(world);
  const magicBoltDef = content.weapons.get("weapon.magic_bolt");
  const weaponStore = ensureWeaponRuntimeStore(world);
  weaponStore.weaponLevels[0] = magicBoltDef.maxLevel;

  const choices = rollUpgradeChoices(world, progression);

  for (let index = 0; index < choices.length; index += 1) {
    const choice = choices[index];
    assert.notEqual(choice.contentId, "weapon.magic_bolt");
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
