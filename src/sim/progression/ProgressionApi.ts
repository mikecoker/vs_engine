import { RunState } from "../core/RunState";
import type { World } from "../world/World";
import { applyUpgradeChoice } from "./UpgradeApply";
import { clearUpgradeChoices, ensureProgressionStore } from "./ProgressionStore";
import { rollUpgradeChoices } from "./UpgradeRoller";
import type { LevelUpPayload } from "./UpgradeChoice";

export function getLevelUpPayload(world: World): LevelUpPayload | null {
  const progression = ensureProgressionStore(world);
  if (progression.currentChoices.length === 0) {
    return null;
  }

  return {
    level: progression.level,
    xp: progression.xp,
    xpToNext: progression.xpToNext,
    queuedLevelUps: progression.queuedLevelUps,
    choiceCount: progression.currentChoices.length,
    choices: progression.currentChoices,
  };
}

export function ensureLevelUpChoices(world: World): LevelUpPayload | null {
  const progression = ensureProgressionStore(world);
  if (progression.currentChoices.length === 0 && progression.queuedLevelUps > 0) {
    rollUpgradeChoices(world, progression);
  }

  return getLevelUpPayload(world);
}

export function selectUpgrade(world: World, choiceIndex: number): boolean {
  const progression = ensureProgressionStore(world);
  const choice = progression.currentChoices[choiceIndex];
  if (!choice) {
    return false;
  }

  const applied = applyUpgradeChoice(world, progression, choice);
  if (!applied) {
    return false;
  }

  if (progression.queuedLevelUps > 0) {
    progression.queuedLevelUps -= 1;
  }

  clearUpgradeChoices(progression);

  if (progression.queuedLevelUps > 0) {
    rollUpgradeChoices(world, progression);
    if (world.runState.current !== RunState.LevelUpChoice) {
      world.commands.stateChange.enqueue(RunState.LevelUpChoice, "levelup-choice-queued");
    }
    return true;
  }

  world.commands.stateChange.enqueue(RunState.Running, "levelup-choice-resolved");
  return true;
}
