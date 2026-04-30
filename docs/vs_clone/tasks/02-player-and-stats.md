# Task 02: Player Runtime, Stats, And Input Application

## Purpose

Implement the player as a simulation-owned runtime object with clean stat aggregation and movement behavior.

## Ownership

Primary write scope:
- `src/sim/player/**`

Allowed shared contract scope:
- `src/sim/core/SimInput.ts`
- `src/sim/core/RenderSnapshot.ts`

Do not edit:
- `src/sim/enemies/**`
- `src/sim/combat/**`
- `src/sim/progression/**`
- `src/client/**`

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)
- [tasks/01-core-loop-and-state.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/01-core-loop-and-state.md)

## Objective

Implement:
- player spawn/reset state
- movement from normalized sim input
- health and invulnerability handling
- runtime stat snapshot calculation
- pickup magnet baseline behavior

## Required File Targets

- `src/sim/player/PlayerStore.ts`
- `src/sim/player/PlayerStats.ts`
- `src/sim/player/PlayerStatSnapshot.ts`
- `src/sim/player/PlayerMovementSystem.ts`
- `src/sim/player/PlayerDamageSystem.ts`
- `src/sim/player/PlayerReset.ts`
- `src/sim/player/PlayerApi.ts`

## Concrete Responsibilities

1. Define the player runtime store.
   One player is enough, but the store must still be formal and resettable.

2. Implement movement.
   Use `moveX` and `moveY` from sim input. Normalize diagonal movement so speed is consistent.

3. Implement runtime stats.
   Minimum stats:
   - move speed
   - max hp
   - armor
   - might
   - cooldown multiplier
   - duration multiplier
   - area multiplier
   - projectile count bonus
   - pickup radius

4. Implement stat aggregation.
   Build a runtime snapshot from base data plus temporary modifiers or upgrade-applied modifiers.

5. Implement player damage intake.
   Support:
   - hp reduction
   - invulnerability frames
   - death trigger integration

6. Implement pickup magnet baseline.
   The player store should expose pickup radius, and the pickup system should be able to read it.

## Implementation Steps

1. Add `PlayerStore` with position, velocity, hp, radius, facing, and invuln fields.
2. Add base stat and derived snapshot types.
3. Add `rebuildPlayerStatSnapshot()` logic.
4. Add player reset/init logic from content-owned player definition.
5. Add input-driven movement system.
6. Add damage application helper for contact and projectile damage.
7. Expose player data through render extraction.

## Interfaces To Produce

- `PlayerStore`
- `PlayerStatSnapshot`
- `rebuildPlayerStatSnapshot()`
- `stepPlayerMovement(context, input)`
- `applyDamageToPlayer(amount, sourceFlags)`

## Interfaces To Consume

- `SimInput` from Worker 1
- run state / world access from Worker 1
- player character content definitions from Worker 6 when available

## Acceptance Criteria

- player can be initialized and reset
- player movement is framerate-independent through fixed-step sim
- diagonal movement is normalized
- damage intake respects invulnerability time
- player death can be observed by the sim core
- no Cocos types appear in player runtime code

## Tests To Add

- movement responds to input and respects speed
- diagonal movement is not faster than axis-aligned movement
- damage intake reduces hp
- invulnerability prevents immediate repeated damage
- stat snapshot rebuild reflects modifier changes

Suggested files:
- `tests/sim/player/player-movement.test.ts`
- `tests/sim/player/player-damage.test.ts`
- `tests/sim/player/player-stats.test.ts`

## Manual Verification

- move in four directions and diagonally
- observe consistent speed
- apply repeated damage in immediate succession and confirm invuln behavior
- modify a stat bonus and confirm downstream systems can read the new snapshot

## Non-Goals

- rendering the player
- weapon firing logic
- full pickup logic

## Coordination Notes

Worker 4 and Worker 5 will depend on stat snapshot semantics. Keep the snapshot compact and stable.
