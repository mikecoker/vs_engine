import assert from "node:assert/strict";
import test from "node:test";

import { loadPrototypeContentRegistry } from "../../../src/sim/content/ContentLoader";
import { ensureWeaponRuntimeStore } from "../../../src/sim/combat/WeaponRuntimeStore";
import { extractRenderSnapshot } from "../../../src/sim/core/RenderExtract";
import { RunState } from "../../../src/sim/core/RunState";
import { mergeSimConfig } from "../../../src/sim/core/SimConfig";
import { initializePlayerForRun } from "../../../src/sim/player/PlayerReset";
import { createWorld } from "../../../src/sim/world/World";

test("weapon render snapshot uses render views instead of runtime store arrays", () => {
  const world = createWorld(mergeSimConfig(), loadPrototypeContentRegistry(), RunState.Running, 59);
  initializePlayerForRun(world.stores.player, world.content);
  const weapons = ensureWeaponRuntimeStore(world);

  weapons.weaponTypeIds[0] = 2;
  weapons.weaponLevels[0] = 3;
  weapons.cooldownRemaining[0] = 1.25;
  weapons.lastFireElapsedSeconds[0] = 4.5;

  const snapshot = extractRenderSnapshot(world);
  snapshot.weapons.typeIds[0] = 99;
  snapshot.weapons.levels[0] = 9;
  snapshot.weapons.cooldownRemaining[0] = 9.5;
  snapshot.weapons.lastFireElapsedSeconds[0] = 8.5;

  assert.equal(weapons.weaponTypeIds[0], 2);
  assert.equal(weapons.weaponLevels[0], 3);
  assert.equal(weapons.cooldownRemaining[0], 1.25);
  assert.equal(weapons.lastFireElapsedSeconds[0], 4.5);
});

