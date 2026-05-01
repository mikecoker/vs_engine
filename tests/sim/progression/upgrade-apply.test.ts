import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { createSim } from "../../../src/sim/core/Sim";
import { RunState } from "../../../src/sim/core/RunState";
import { ensureWeaponRuntimeStore } from "../../../src/sim/combat/WeaponRuntimeStore";
import { applyUpgradeChoice } from "../../../src/sim/progression/UpgradeApply";
import { ensureProgressionStore } from "../../../src/sim/progression/ProgressionStore";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { initializePlayerForRun } from "../../../src/sim/player/PlayerReset";
import { createWorld } from "../../../src/sim/world/World";

test("passive upgrades rebuild player runtime stats", () => {
  const content = loadPrototypeContentRegistry();
  const world = createWorld(mergeSimConfig(), content, RunState.Running, 41);
  initializePlayerForRun(world.stores.player, content);
  const progression = ensureProgressionStore(world);

  const applied = applyUpgradeChoice(world, progression, {
    choiceId: "passive:passive.wings:1",
    kind: "passive",
    contentIndex: content.passiveUpgrades.getIndex("passive.wings"),
    contentId: "passive.wings",
    displayName: "Wings",
    description: "Increases movement speed.",
    iconKey: "passive_wings",
    currentLevel: 0,
    nextLevel: 1,
    maxLevel: 5,
  });

  assert.equal(applied, true);
  assert.equal(world.stores.player.statSnapshot.moveSpeed, 172);
});

test("pickup radius passive increases collection reach", () => {
  const content = loadPrototypeContentRegistry();
  const world = createWorld(mergeSimConfig(), content, RunState.Running, 42);
  initializePlayerForRun(world.stores.player, content);
  const progression = ensureProgressionStore(world);

  const applied = applyUpgradeChoice(world, progression, {
    choiceId: "passive:passive.crown:1",
    kind: "passive",
    contentIndex: content.passiveUpgrades.getIndex("passive.crown"),
    contentId: "passive.crown",
    displayName: "Crown",
    description: "Improves experience pickup reach.",
    iconKey: "passive_crown",
    currentLevel: 0,
    nextLevel: 1,
    maxLevel: 5,
  });

  assert.equal(applied, true);
  assert.equal(world.stores.player.pickupRadius, 120);
});

test("weapon unlock choices add a runtime slot", () => {
  const content = loadPrototypeContentRegistry();
  const world = createWorld(mergeSimConfig(), content, RunState.Running, 43);
  initializePlayerForRun(world.stores.player, content);
  const progression = ensureProgressionStore(world);
  const weapons = ensureWeaponRuntimeStore(world);

  const applied = applyUpgradeChoice(world, progression, {
    choiceId: "weapon_unlock:weapon.holy_aura",
    kind: "weapon_unlock",
    contentIndex: content.weapons.getIndex("weapon.holy_aura"),
    contentId: "weapon.holy_aura",
    displayName: "Holy Aura",
    description: "Damages enemies around the player.",
    iconKey: "weapon_holy_aura",
    currentLevel: 0,
    nextLevel: 1,
    maxLevel: 8,
  });

  assert.equal(applied, true);
  assert.equal(weapons.activeCount, 2);
  assert.equal(weapons.weaponLevels[1], 1);
});

test("sim resumes after selecting the only queued upgrade", () => {
  const sim = createSim({}, loadPrototypeContentRegistry(), 101);
  sim.resetRun(101);
  sim.step(1 / 60);

  for (let tick = 0; tick < 5; tick += 1) {
    sim.step(1 / 60, {
      moveX: 0,
      moveY: 0,
      pausePressed: false,
      confirmPressed: false,
      cancelPressed: false,
      debugGrantXpPressed: true,
      debugSpawnWavePressed: false,
    });
  }

  sim.step(1 / 60);

  const payload = sim.getLevelUpPayload();
  assert.ok(payload);
  assert.equal(payload?.choiceCount, 3);

  const selected = sim.selectUpgrade(0);
  assert.equal(selected, true);

  sim.step(1 / 60);
  assert.equal(sim.getRenderSnapshot().runState, RunState.Running);
});
