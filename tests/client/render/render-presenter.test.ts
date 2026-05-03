import assert from "node:assert/strict";
import test from "node:test";

import { RenderPresenter } from "@vs-engine/runtime/src/client/render/RenderPresenter";
import { loadPrototypeContentRegistry } from "@vs-engine/runtime/src/sim/content/ContentLoader";
import { pickupId } from "@vs-engine/runtime/src/sim/content/ContentIds";
import { RunState } from "@vs-engine/runtime/src/sim/core/RunState";
import {
  EMPTY_ENTITY_RENDER_SNAPSHOT,
  type RenderSnapshot,
} from "@vs-engine/runtime/src/sim/core/RenderSnapshot";

function presentSinglePickupFrame(pickupTypeId: number) {
  const content = loadPrototypeContentRegistry();
  const presenter = new RenderPresenter(content);

  return presenter.present({
    runState: RunState.Running,
    elapsedSeconds: 0,
    player: {
      exists: true,
      x: 0,
      y: 0,
      radius: 10,
      hp: 20,
      maxHp: 20,
    },
    enemies: EMPTY_ENTITY_RENDER_SNAPSHOT,
    projectiles: EMPTY_ENTITY_RENDER_SNAPSHOT,
    pickups: {
      activeCount: 1,
      typeIds: new Uint16Array([pickupTypeId]),
      posX: new Float32Array([12]),
      posY: new Float32Array([18]),
    },
    progression: {
      level: 1,
      xp: 0,
      xpToNext: 5,
      queuedLevelUps: 0,
    },
    weapons: {
      activeCount: 0,
      typeIds: new Uint16Array(0),
      levels: new Uint8Array(0),
      cooldownRemaining: new Float32Array(0),
      lastFireElapsedSeconds: new Float32Array(0),
    },
  } satisfies RenderSnapshot);
}

test("health pickups present as a larger heart visual", () => {
  const content = loadPrototypeContentRegistry();
  const healPickupIndex = content.pickups.getIndex(pickupId("pickup.heal_small"));
  const frame = presentSinglePickupFrame(healPickupIndex);

  assert.equal(frame.pickups[0].grantKind, "heal");
  assert.equal(frame.pickups[0].spriteKey, "pickup_heart_red");
  assert.equal(frame.pickups[0].visualScale >= 1.5, true);
});

test("magnet pickups present larger than default pickups", () => {
  const content = loadPrototypeContentRegistry();
  const magnetPickupIndex = content.pickups.getIndex(pickupId("pickup.magnet_small"));
  const frame = presentSinglePickupFrame(magnetPickupIndex);

  assert.equal(frame.pickups[0].grantKind, "magnet");
  assert.equal(frame.pickups[0].spriteKey, "pickup_magnet_blue");
  assert.equal(frame.pickups[0].visualScale, 2.25);
});
