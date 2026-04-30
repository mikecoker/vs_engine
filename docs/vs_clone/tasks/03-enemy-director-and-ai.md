# Task 03: Enemy Runtime, Spawn Director, And Movement

## Purpose

Implement a scalable enemy store and the minimal director needed to sustain the prototype gameplay loop.

## Ownership

Primary write scope:
- `src/sim/enemies/**`
- `src/sim/spatial/**`

Allowed shared contract scope:
- `src/sim/core/RenderSnapshot.ts`

Do not edit:
- `src/sim/player/**`
- `src/sim/combat/**`
- `src/sim/progression/**`
- `src/client/**`

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Objective

Implement:
- enemy storage
- wave-driven spawn pacing
- offscreen spawn selection
- chase movement
- spatial grid occupancy for collision queries

## Required File Targets

- `src/sim/enemies/EnemyStore.ts`
- `src/sim/enemies/EnemyArchetypeRuntime.ts`
- `src/sim/enemies/SpawnDirector.ts`
- `src/sim/enemies/SpawnDirectorSystem.ts`
- `src/sim/enemies/EnemySpawnSystem.ts`
- `src/sim/enemies/EnemyMovementSystem.ts`
- `src/sim/enemies/EnemyLifecycle.ts`
- `src/sim/spatial/SpatialGrid.ts`
- `src/sim/spatial/SpatialGridBuildSystem.ts`

## Concrete Responsibilities

1. Define enemy typed-array storage.
   Follow the store rules from the data layout doc.

2. Implement the spawn director.
   It must:
   - track elapsed run time
   - choose enemy archetypes from content data
   - enforce max active enemy cap
   - emit spawn commands rather than mutating the store directly

3. Implement offscreen ring spawning.
   Enemies should spawn outside the player’s visible-safe radius.

4. Implement chase movement.
   For prototype scope, move directly toward the player.

5. Implement the spatial grid.
   The grid should support:
   - rebuild each tick
   - querying nearby cells for collision and local lookups

6. Implement enemy death cleanup hooks.
   Enemy death should not itself resolve XP; it should expose enough information for combat/progression systems to act on.

## Implementation Steps

1. Add `EnemyStore`.
2. Add enemy archetype runtime loader or runtime-access helpers.
3. Add `SpawnDirector` state with timers and pacing values.
4. Add spawn command enqueue path.
5. Add apply-spawn path that allocates enemy slots from commands.
6. Add chase movement update loop.
7. Add `SpatialGrid`.
8. Add grid rebuild from active enemy positions.
9. Expose enemy positions and type IDs through render extraction.

## Interfaces To Produce

- `EnemyStore`
- `SpawnDirector`
- `stepSpawnDirector(context)`
- `applyEnemySpawnCommands(context)`
- `stepEnemyMovement(context)`
- `SpatialGrid`
- `rebuildSpatialGrid(context)`

## Interfaces To Consume

- player position from Worker 2
- command buffers and world shell from Worker 1
- enemy archetype defs and wave defs from Worker 6

## Acceptance Criteria

- enemies can be spawned from commands into reusable slots
- max active enemy cap is enforced
- enemies do not spawn inside the player safe radius
- enemies move toward the player each tick
- spatial grid can be rebuilt from active enemy state
- no physics engine dependency is introduced for core enemy motion

## Tests To Add

- enemy slot allocation and release works
- spawn director emits expected count under a simple timer configuration
- offscreen spawn rule respects safe radius
- chase movement reduces distance to player
- spatial grid query returns nearby enemies for a known setup

Suggested files:
- `tests/sim/enemies/enemy-store.test.ts`
- `tests/sim/enemies/spawn-director.test.ts`
- `tests/sim/enemies/enemy-movement.test.ts`
- `tests/sim/spatial/spatial-grid.test.ts`

## Manual Verification

- spawn a wave repeatedly
- confirm enemies appear around the player rather than on top of them
- confirm active count grows to cap and stabilizes
- confirm enemies visibly converge on player position

## Non-Goals

- complex enemy state machines
- ranged AI
- boss behaviors

## Coordination Notes

Worker 4 will depend on the spatial grid and enemy store shape. Keep those APIs minimal and query-focused.
