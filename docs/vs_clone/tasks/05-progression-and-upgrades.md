# Task 05: XP, Levels, And Upgrade Application

## Purpose

Implement the run progression loop that turns kills into XP, XP into levels, and levels into build changes.

## Ownership

Primary write scope:
- `src/sim/progression/**`

Allowed shared contract scope:
- `src/sim/core/RunState.ts`
- `src/sim/core/RenderSnapshot.ts`

Do not edit:
- `src/sim/player/**`
- `src/sim/enemies/**`
- `src/sim/combat/**`
- `src/client/**`

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Objective

Implement:
- XP intake
- level thresholds
- queued level-ups
- choice generation
- upgrade application to player and weapon runtime state

## Required File Targets

- `src/sim/progression/ProgressionStore.ts`
- `src/sim/progression/ProgressionSystem.ts`
- `src/sim/progression/LevelCurve.ts`
- `src/sim/progression/UpgradeChoice.ts`
- `src/sim/progression/UpgradeRoller.ts`
- `src/sim/progression/UpgradeApply.ts`
- `src/sim/progression/ProgressionApi.ts`

## Concrete Responsibilities

1. Define the progression store.
   It should track:
   - current level
   - current XP
   - XP to next level
   - queued level-up count
   - current offered choices

2. Implement XP intake.
   XP should come from pickup collection or explicit XP grant commands.

3. Implement level threshold crossing.
   Crossing a threshold must:
   - update level
   - queue a level-up
   - request `levelup_choice` run state

4. Implement choice generation.
   Support:
   - weighted random choice pool
   - filtering invalid choices
   - no exhausted or impossible choices

5. Implement upgrade application.
   Support:
   - player stat upgrades
   - weapon unlock
   - weapon rank up

6. Implement resume flow after selection.
   After an upgrade is chosen, the sim should resume running if no further level-up is queued.

## Implementation Steps

1. Add `ProgressionStore`.
2. Add level curve helpers.
3. Add XP grant consumption.
4. Add threshold crossing loop so multiple levels in one batch can queue correctly.
5. Add upgrade choice generator from content defs.
6. Add upgrade apply helpers.
7. Add sim-facing API to select one choice index.
8. Expose level and XP HUD numbers in render snapshot.

## Interfaces To Produce

- `ProgressionStore`
- `stepProgression(context)`
- `rollUpgradeChoices(context)`
- `applyUpgradeChoice(context, choiceId)`
- `selectUpgrade(choiceIndex)`

## Interfaces To Consume

- XP grant buffer from Worker 1 / Worker 4
- player stat application points from Worker 2
- weapon runtime application points from Worker 4
- upgrade defs from Worker 6

## Acceptance Criteria

- XP grants increase progression state
- threshold crossing can queue level-up state
- offered choices are valid for current build state
- selecting an upgrade changes player or weapon behavior
- sim resumes correctly after level-up handling

## Tests To Add

- XP threshold crossing increments level
- multiple level gains in one XP batch queue properly
- invalid upgrade choices are filtered
- weapon unlock choice adds a weapon slot or level
- stat upgrade changes player snapshot inputs

Suggested files:
- `tests/sim/progression/xp-leveling.test.ts`
- `tests/sim/progression/upgrade-roller.test.ts`
- `tests/sim/progression/upgrade-apply.test.ts`

## Manual Verification

- kill enemies until XP is collected
- confirm level-up state triggers
- confirm three visible choices can be selected
- confirm the chosen upgrade changes runtime behavior

## Non-Goals

- full meta-progression
- reroll/banish/seal unless trivial to scaffold
- deep evolution systems beyond one basic path hook

## Coordination Notes

Worker 7 will depend on the level-up payload contract. Keep the choice payload explicit and UI-ready.
