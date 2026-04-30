# Agent Assignment Matrix

## Purpose

This file is the operator guide for launching subagents against the sim-first architecture.

Use it to decide:
- which workers can start now
- which task doc to hand them
- what exact deliverable they should finish in the current batch
- what branch name and write scope they should own

## Required Context For Every Worker

Every worker should be told to read:
- [00-overview.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/00-overview.md)
- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

Every worker prompt should also include:
- they are not alone in the codebase
- they must not revert unrelated changes
- they should stay within their owned write scope
- if they need shared contract changes, keep them minimal and explicit

## Batch Plan

### Batch A: Sim Contracts And Bootstrap

Start immediately:
- Worker 1
- Worker 6
- Worker 8

Goal:
- create the sim shell, content contracts, and test/debug entry points

Required outputs before starting the next batch:
- sim entry point exists
- run state and fixed-step contracts exist
- content registry and starter IDs exist
- test bootstrap can construct a sim

### Batch B: First Combatable Runtime

Start after Batch A:
- Worker 2
- Worker 3
- Worker 4

Goal:
- make a playable survival loop without progression UI polish

Required outputs before starting the next batch:
- player can move and take damage
- enemies can spawn and chase
- projectiles can hit and kill enemies
- kills can emit XP-related consequences

### Batch C: Progression And Client Shell

Start after Batch B:
- Worker 5
- Worker 7

Goal:
- create the level-up loop and playable Cocos presentation shell

Required outputs before hardening:
- XP can trigger level-up
- UI can display choices
- upgrades can affect runtime behavior
- render sync can show the whole loop

### Batch D: Hardening

Run after a full slice works:
- Worker 8
- Worker 6
- optionally Worker 3, 4, or 5 for expansion follow-ups

Goal:
- test coverage, instrumentation, and prototype stability

## Branch Ownership

Recommended branches:
- Worker 1: `feat/sim-core-shell`
- Worker 2: `feat/player-runtime`
- Worker 3: `feat/enemy-runtime`
- Worker 4: `feat/combat-runtime`
- Worker 5: `feat/progression-runtime`
- Worker 6: `feat/content-registry`
- Worker 7: `feat/cocos-bridge-ui`
- Worker 8: `feat/sim-tests-debug`

Each worker should own exactly one branch and one primary write scope.

## Worker Summary

### Worker 1

Task doc:
- [tasks/01-core-loop-and-state.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/01-core-loop-and-state.md)

Primary scope:
- `src/sim/core/**`
- `src/sim/world/**`

Current batch deliverable:
- working sim shell with fixed-step stepping, run state, world bootstrap, command buffers, and render/debug snapshot entry points

### Worker 2

Task doc:
- [tasks/02-player-and-stats.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/02-player-and-stats.md)

Primary scope:
- `src/sim/player/**`

Current batch deliverable:
- resettable player runtime with movement, hp, invulnerability, and stat snapshot support

### Worker 3

Task doc:
- [tasks/03-enemy-director-and-ai.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/03-enemy-director-and-ai.md)

Primary scope:
- `src/sim/enemies/**`
- `src/sim/spatial/**`

Current batch deliverable:
- enemy store, spawn director, chase movement, and rebuilt spatial grid

### Worker 4

Task doc:
- [tasks/04-combat-and-hit-processing.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/04-combat-and-hit-processing.md)

Primary scope:
- `src/sim/combat/**`
- `src/sim/projectiles/**`

Current batch deliverable:
- auto-fire weapon, projectile storage/movement, hit queries, and damage resolution

### Worker 5

Task doc:
- [tasks/05-progression-and-upgrades.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/05-progression-and-upgrades.md)

Primary scope:
- `src/sim/progression/**`

Current batch deliverable:
- XP intake, level thresholds, upgrade rolls, and apply-choice flow

### Worker 6

Task doc:
- [tasks/06-meta-content-data-and-save.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/06-meta-content-data-and-save.md)

Primary scope:
- `src/sim/content/**`

Current batch deliverable:
- stable content IDs, typed defs, validation, and starter prototype registry

### Worker 7

Task doc:
- [tasks/07-ui-ux-and-run-presentation.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/07-ui-ux-and-run-presentation.md)

Primary scope:
- `src/client/**`

Current batch deliverable:
- Cocos bridge, render pools, HUD shell, and level-up UI shell

### Worker 8

Task doc:
- [tasks/08-performance-tooling-and-test-harness.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/08-performance-tooling-and-test-harness.md)

Primary scope:
- `tests/sim/**`
- `src/sim/debug/**`

Current batch deliverable:
- test bootstrap helpers, debug counters, and deterministic stepping helpers

## Ready-To-Send Prompts

These prompts are written to be pasted directly into subagent launches.

### Prompt: Worker 1

You own the sim shell. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/04-sim-data-layout.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/01-core-loop-and-state.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `src/sim/core/**`
- `src/sim/world/**`
- allowed shared scope: `src/sim/debug/**`

Implement the current batch deliverable from the task doc:
- a headless-capable sim shell with fixed-step stepping
- `RunState`
- `World` bootstrap/reset
- command buffer ownership
- ordered system pipeline stubs
- render and debug snapshot entry points

Create the concrete file targets listed in the task doc. Keep shared contracts minimal and stable for downstream workers. Add the required tests under `tests/sim/core/**` if your scope needs them. In your final report, list changed files, what contracts you introduced, and any blockers for Workers 2 through 8.

### Prompt: Worker 2

You own player runtime. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/04-sim-data-layout.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/02-player-and-stats.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `src/sim/player/**`
- allowed shared scope only if strictly needed: `src/sim/core/SimInput.ts`, `src/sim/core/RenderSnapshot.ts`

Implement the current batch deliverable from the task doc:
- resettable player runtime
- movement from normalized sim input
- hp and invulnerability
- runtime stat snapshot calculation

Create the file targets listed in the task doc. Consume sim-core contracts rather than redefining them. Add the required tests under `tests/sim/player/**` if test scaffolding is available. In your final report, list changed files, exported player contracts, and any assumptions Worker 4 or Worker 5 must know.

### Prompt: Worker 3

You own enemy runtime and spatial queries. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/04-sim-data-layout.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/03-enemy-director-and-ai.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `src/sim/enemies/**`
- `src/sim/spatial/**`
- allowed shared scope only if strictly needed: `src/sim/core/RenderSnapshot.ts`

Implement the current batch deliverable from the task doc:
- enemy typed-array store
- spawn director
- offscreen ring spawning
- chase movement
- spatial grid rebuild/query support

Create the file targets listed in the task doc. Do not push combat logic into enemy systems. Add the required tests under `tests/sim/enemies/**` and `tests/sim/spatial/**` if test scaffolding is available. In your final report, list changed files, spatial-grid/query contracts, and anything Worker 4 must align with.

### Prompt: Worker 4

You own combat and projectiles. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/04-sim-data-layout.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/04-combat-and-hit-processing.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `src/sim/combat/**`
- `src/sim/projectiles/**`
- allowed shared scope only if strictly needed: `src/sim/core/RenderSnapshot.ts`

Implement the current batch deliverable from the task doc:
- player-owned weapon runtime
- auto-fire logic
- projectile store and movement
- projectile hit queries using spatial grid
- contact damage queries
- centralized damage resolution

Create the file targets listed in the task doc. Keep hot loops allocation-free. Do not mutate enemy or player systems directly outside their exposed contracts. Add the required tests under `tests/sim/combat/**` and `tests/sim/projectiles/**` if test scaffolding is available. In your final report, list changed files, combat contracts, and follow-up needs for Worker 5 and Worker 7.

### Prompt: Worker 5

You own run progression. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/04-sim-data-layout.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/05-progression-and-upgrades.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `src/sim/progression/**`
- allowed shared scope only if strictly needed: `src/sim/core/RunState.ts`, `src/sim/core/RenderSnapshot.ts`

Implement the current batch deliverable from the task doc:
- XP intake
- level threshold crossing
- level-up queueing
- upgrade choice generation
- upgrade application to player or weapon runtime

Create the file targets listed in the task doc. Keep choice payloads explicit for UI consumption. Add the required tests under `tests/sim/progression/**` if test scaffolding is available. In your final report, list changed files, level-up payload contracts, and anything Worker 7 must render.

### Prompt: Worker 6

You own content definitions and validation. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/04-sim-data-layout.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/06-meta-content-data-and-save.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `src/sim/content/**`

Implement the current batch deliverable from the task doc:
- durable content IDs
- typed content definition contracts
- validation
- starter prototype registry
- save-ready data shapes

Create the file targets listed in the task doc. Prioritize stability of IDs and field names over content quantity. Add the required tests under `tests/sim/content/**` if test scaffolding is available. In your final report, list changed files, registry/lookup contracts, and any unresolved field-name decisions other workers should know.

### Prompt: Worker 7

You own the Cocos bridge and client shell. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/07-ui-ux-and-run-presentation.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `src/client/**`
- allowed shared scope only if strictly needed: `src/sim/core/RenderSnapshot.ts`

Implement the current batch deliverable from the task doc:
- `SimSceneBridge`
- input adaptation into `SimInput`
- render pools for visible entities
- HUD shell
- level-up UI shell

Create the file targets listed in the task doc. Keep gameplay truth in the sim. Do not move combat or progression logic into client code. Add lightweight client tests if the setup exists; otherwise document manual verification clearly. In your final report, list changed files, bridge contracts, and any sim API assumptions that need confirmation.

### Prompt: Worker 8

You own deterministic test helpers and debug instrumentation. Read:
- `docs/vs_clone/00-overview.md`
- `docs/vs_clone/03-sim-architecture.md`
- `docs/vs_clone/04-sim-data-layout.md`
- `docs/vs_clone/05-sim-integration-contracts.md`
- `docs/vs_clone/tasks/08-performance-tooling-and-test-harness.md`

You are not alone in the codebase. Do not revert unrelated changes. Stay inside:
- `tests/sim/**`
- `src/sim/debug/**`
- minimal shared hooks in `src/sim/core/**` only if required for instrumentation

Implement the current batch deliverable from the task doc:
- `createTestSim`
- deterministic stepping helpers
- debug counters and snapshots
- debug commands

Create the file targets listed in the task doc. Keep instrumentation lightweight and non-invasive. Add the required tests for helpers and debug commands. In your final report, list changed files, new test utilities, and any sim-core hooks Worker 1 should stabilize.

## Recommended Launch Order

Launch first:
- Worker 1
- Worker 6
- Worker 8

Then launch:
- Worker 2
- Worker 3

Then launch:
- Worker 4

Then launch:
- Worker 5
- Worker 7

## Minimum Batch Deliverables

### Batch A complete

- sim can be constructed and stepped
- content registry validates
- tests can create a sim and advance ticks

### Batch B complete

- player moves
- enemies spawn and chase
- projectiles kill enemies
- enemy deaths emit XP-related consequences

### Batch C complete

- XP can trigger level-up
- UI can show and apply choices
- render sync shows the full loop

### Batch D complete

- smoke coverage exists for prototype loop
- debug counters and commands are usable
- prototype stability issues are visible and testable
