# Task 08: Deterministic Harness, Perf Counters, And Debug Cheats

## Purpose

Keep the sim testable and observable while the feature workers build the runtime.

## Ownership

Primary write scope:
- `tests/sim/**`
- `src/sim/debug/**`

Allowed shared contract scope:
- minimal hooks in `src/sim/core/**` when needed for instrumentation

Do not edit:
- feature behavior in runtime stores unless the change is strictly for instrumentation or test access

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Objective

Implement:
- sim bootstrap helpers for tests
- deterministic stepping helpers
- debug counters and snapshots
- cheat/debug command plumbing

## Required File Targets

- `tests/sim/createTestSim.ts`
- `tests/sim/helpers/stepSim.ts`
- `tests/sim/helpers/fakeInput.ts`
- `src/sim/debug/DebugCounters.ts`
- `src/sim/debug/DebugSnapshot.ts`
- `src/sim/debug/DebugCommands.ts`
- `src/sim/debug/DebugSystem.ts`

## Concrete Responsibilities

1. Build test helpers.
   Tests should not all hand-roll sim boot code.

2. Build deterministic stepping helpers.
   Helpers should advance a chosen number of fixed ticks with known inputs.

3. Add debug counters.
   Minimum counters:
   - active enemies
   - active projectiles
   - active pickups
   - damage requests processed
   - spawn commands processed

4. Add debug commands.
   Minimum commands:
   - grant XP
   - spawn test wave
   - kill all enemies

5. Add smoke coverage for end-to-end prototype flow as other systems land.

## Implementation Steps

1. Add `createTestSim()` helper with default content and seed.
2. Add `stepSimTicks(sim, ticks, input?)`.
3. Add fake input builders.
4. Add debug counters container on `World`.
5. Add a debug snapshot read API.
6. Add debug command queue or direct debug API owned by sim.
7. Add one end-to-end smoke test once core gameplay works.

## Interfaces To Produce

- test bootstrap helpers
- debug snapshot contract
- debug command helpers

## Interfaces To Consume

- sim API from Worker 1
- feature runtime data from Workers 2 through 5 as they land

## Acceptance Criteria

- tests can create and step the sim without Cocos
- debug counters expose active counts
- debug commands can trigger XP and enemy-spawn flows
- at least one smoke test covers a short combat loop once dependencies exist

## Tests To Add

- create-test-sim helper boots successfully
- stepping helper advances expected tick count
- debug commands change sim state as expected

Suggested files:
- `tests/sim/debug/debug-commands.test.ts`
- `tests/sim/debug/debug-snapshot.test.ts`
- `tests/sim/smoke/prototype-loop.test.ts`

## Manual Verification

- run debug commands from a minimal script or client hook
- verify counters react as enemies/projectiles/pickups change
- force XP gain and confirm level-up state appears

## Non-Goals

- production analytics
- deep profiling integration
- performance optimization beyond visibility and harness support

## Coordination Notes

Keep instrumentation hooks small. The point is to expose behavior, not to become the owner of feature systems.
