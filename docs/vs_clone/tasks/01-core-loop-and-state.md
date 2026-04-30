# Task 01: Sim Core, Run State, And World Boot

## Purpose

Build the simulation shell that every other worker depends on.

This is the highest-priority task. Other workers should not invent their own update loop or world ownership model.

## Ownership

Primary write scope:
- `src/sim/core/**`
- `src/sim/world/**`

Allowed shared contract scope:
- `src/sim/debug/**`

Do not edit:
- `src/sim/player/**`
- `src/sim/enemies/**`
- `src/sim/combat/**`
- `src/sim/projectiles/**`
- `src/sim/pickups/**`
- `src/sim/progression/**`
- `src/client/**`

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Objective

Implement a headless-capable, fixed-step simulation shell with:
- run state
- world bootstrap
- system sequencing
- seeded RNG
- command buffer ownership
- render extraction hooks

## Required File Targets

Create or own:
- `src/sim/core/Sim.ts`
- `src/sim/core/SimApi.ts`
- `src/sim/core/SimConfig.ts`
- `src/sim/core/RunState.ts`
- `src/sim/core/FrameContext.ts`
- `src/sim/core/SimInput.ts`
- `src/sim/core/RenderSnapshot.ts`
- `src/sim/core/RenderExtract.ts`
- `src/sim/world/World.ts`
- `src/sim/world/WorldFactory.ts`
- `src/sim/world/WorldReset.ts`
- `src/sim/core/commands/*`

## Concrete Responsibilities

1. Define the fixed-step loop contract.
   The sim must accept variable frame time and internally advance at `1 / 60` second steps.

2. Define `RunState`.
   Minimum states:
   - `boot`
   - `main_menu`
   - `starting_run`
   - `running`
   - `paused`
   - `levelup_choice`
   - `game_over`

3. Implement the top-level `World`.
   It must aggregate all stores, command buffers, shared RNG, config, debug counters, and system-local scratch structures.

4. Implement command buffer ownership.
   Create dedicated buffers for:
   - enemy spawn
   - projectile spawn
   - pickup spawn
   - damage
   - XP grant
   - despawn requests
   - run state changes

5. Implement ordered system execution.
   It is acceptable for some systems to be stubs initially, but the order and integration points must exist.

6. Implement reset behavior.
   Resetting a run must clear transient runtime state without reconstructing the whole application shell.

7. Implement render extraction entry points.
   Other workers must be able to expose data through a stable render snapshot.

## Implementation Steps

1. Add `RunState` enum or string union and a small transition helper.
2. Add `SimConfig` with fixed-step settings and capacity defaults.
3. Add `SimInput` type.
4. Add `World` and `WorldFactory` that instantiate empty stores and buffers.
5. Add `FrameContext`.
6. Add `Sim.step(frameSeconds, inputFrame)`.
7. Add accumulator logic with substep cap.
8. Add no-op or stub system execution list in the intended order.
9. Add `resetRun(seed?)`.
10. Add `getRenderSnapshot()` and `getDebugSnapshot()`.

## Interfaces To Produce

Worker 1 must define stable exports for downstream workers:
- `RunState`
- `Sim`
- `SimInput`
- `FrameContext`
- `World`
- command buffer interfaces
- render snapshot base shape

## Interfaces To Consume

This worker should not depend on downstream feature systems being complete.

Where needed:
- define system hook interfaces with placeholders
- provide stubs so later workers can slot in their systems

## Acceptance Criteria

- the sim can be constructed without Cocos
- `step()` can be called repeatedly with normalized input
- `resetRun()` produces a clean world state
- run state transitions can pause simulation updates
- the ordered system pipeline exists, even if some systems are placeholders
- no sim file imports Cocos types

## Tests To Add

Add at least:
- sim constructs successfully
- fixed-step stepping advances tick count deterministically
- pause state prevents gameplay system stepping
- reset clears transient world state

Suggested files:
- `tests/sim/core/sim-bootstrap.test.ts`
- `tests/sim/core/fixed-step.test.ts`
- `tests/sim/core/run-state.test.ts`

## Manual Verification

- instantiate the sim in a minimal script
- advance 120 ticks
- set pause
- confirm tick advances but gameplay systems are skipped if that is the chosen design
- reset and confirm empty runtime counts

## Non-Goals

- feature-complete enemy logic
- weapon logic
- UI logic
- content authoring details

## Blockers To Surface

Raise a coordination issue if:
- another worker needs to change system order semantics
- render extraction requires mutating sim state
- a shared contract would force Cocos imports into `src/sim/**`
