import type { FrameContext } from "../core/FrameContext";
import { RunState } from "../core/RunState";
import { ensureLevelUpChoices } from "./ProgressionApi";
import { getXpThresholdForLevel, resolveActiveProgressionCurve } from "./LevelCurve";
import { ensureProgressionStore } from "./ProgressionStore";

function grantXp(store: ReturnType<typeof ensureProgressionStore>, amount: number): void {
  if (amount <= 0) {
    return;
  }

  store.xp += amount;
}

function consumeXpGrantCommands(context: FrameContext): void {
  const progression = ensureProgressionStore(context.world);
  for (let index = 0; index < context.world.commands.xpGrant.count; index += 1) {
    const command = context.world.commands.xpGrant.get(index);
    grantXp(progression, command.amount);
  }
  context.world.commands.xpGrant.clear();
}

function updateThresholdsAndQueue(context: FrameContext): void {
  const progression = ensureProgressionStore(context.world);
  const curveInfo = resolveActiveProgressionCurve(context.world.content);
  progression.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, progression.level);

  while (progression.xp >= progression.xpToNext && progression.xpToNext > 0) {
    progression.xp -= progression.xpToNext;
    progression.level += 1;
    progression.queuedLevelUps += 1;
    progression.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, progression.level);
  }
}

function queueLevelUpState(context: FrameContext): void {
  const progression = ensureProgressionStore(context.world);
  if (progression.queuedLevelUps <= 0) {
    return;
  }

  ensureLevelUpChoices(context.world);
  if (context.world.runState.current !== RunState.LevelUpChoice) {
    context.world.commands.stateChange.enqueue(RunState.LevelUpChoice, "levelup-threshold-crossed");
  }
}

export function stepProgression(context: FrameContext): void {
  ensureProgressionStore(context.world);
  consumeXpGrantCommands(context);
  updateThresholdsAndQueue(context);
  queueLevelUpState(context);
}
