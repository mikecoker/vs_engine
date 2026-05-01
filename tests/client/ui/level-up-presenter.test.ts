import assert from "node:assert/strict";
import test from "node:test";

import { presentLevelUp } from "../../../src/client/ui/LevelUpPresenter";

test("presentLevelUp hides the overlay when no payload exists", () => {
  const view = presentLevelUp(null);
  assert.equal(view.visible, false);
  assert.equal(view.choices.length, 0);
});

test("presentLevelUp exposes ui-ready choice data", () => {
  const view = presentLevelUp({
    level: 4,
    xp: 2,
    xpToNext: 10,
    queuedLevelUps: 1,
    choiceCount: 1,
    choices: [
      {
        choiceId: "passive-0-1",
        kind: "passive",
        contentIndex: 0,
        contentId: "passive.empty_tome",
        displayName: "Empty Tome",
        description: "Reduce cooldown.",
        iconKey: "passive_empty_tome",
        currentLevel: 0,
        nextLevel: 1,
        maxLevel: 5,
      },
    ],
  });

  assert.equal(view.visible, true);
  assert.equal(view.level, 4);
  assert.equal(view.choices[0]?.displayName, "Empty Tome");
});
