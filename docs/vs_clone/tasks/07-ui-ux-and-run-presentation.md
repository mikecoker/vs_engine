# Task 07: Cocos Bridge, Render Sync, And Basic UI Shell

## Purpose

Bridge the headless simulation into a playable Cocos scene without making Cocos the owner of gameplay truth.

## Ownership

Primary write scope:
- `src/client/**`

Allowed shared contract scope:
- `src/sim/core/RenderSnapshot.ts`

Do not edit:
- runtime gameplay logic in `src/sim/**` except agreed shared read-only contracts

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Objective

Implement:
- Cocos-to-sim scene bridge
- input adaptation
- render node pooling and transform sync
- HUD shell
- level-up choice shell

## Required File Targets

- `src/client/cocos/SimSceneBridge.ts`
- `src/client/input/CocosInputAdapter.ts`
- `src/client/render/RenderPresenter.ts`
- `src/client/render/EnemyRenderPool.ts`
- `src/client/render/ProjectileRenderPool.ts`
- `src/client/render/PickupRenderPool.ts`
- `src/client/render/PlayerPresenter.ts`
- `src/client/ui/HudPresenter.ts`
- `src/client/ui/LevelUpPresenter.ts`
- `src/client/ui/RunStatePresenter.ts`

## Concrete Responsibilities

1. Adapt device input into `SimInput`.
   The bridge must not leak raw device state into the sim.

2. Step the sim from the scene update loop.
   The bridge should pass frame delta to the sim and then read a render snapshot.

3. Implement render pools.
   One node per visible entity is fine for the prototype, but node reuse is required.

4. Sync render nodes from snapshot data.
   The renderer should update:
   - player transform
   - active enemy transforms
   - active projectile transforms
   - active pickup transforms

5. Implement the HUD shell.
   Show at minimum:
   - hp
   - level
   - XP progress
   - elapsed run time

6. Implement level-up shell behavior.
   Read offered upgrade choices and route selection back to sim API.

## Implementation Steps

1. Add input adapter and normalized movement mapping.
2. Add scene bridge with sim construction and stepping.
3. Add render pools for each visible category.
4. Add render presenter consuming `RenderSnapshot`.
5. Add HUD update flow.
6. Add basic pause and game-over display shell.
7. Add level-up selection UI scaffold wired to sim choice API.

## Interfaces To Produce

- `SimSceneBridge`
- `CocosInputAdapter`
- render presenters and pools
- UI presenters bound to snapshot and sim APIs

## Interfaces To Consume

- `Sim`, `SimInput`, `RenderSnapshot` from Worker 1
- level-up payload from Worker 5
- content display metadata from Worker 6

## Acceptance Criteria

- the scene can boot the sim
- player input updates sim movement
- visible enemies/projectiles/pickups are rendered from snapshot data
- HUD updates from sim state
- level-up UI can present and select choices
- gameplay does not break if render nodes are recreated or hidden

## Tests To Add

If client test coverage exists, add light adapter tests. Otherwise document manual verification.

Suggested checks:
- input adapter normalizes movement
- level-up presenter maps choice selection to sim API call

## Manual Verification

- run the scene
- move the player
- watch enemies spawn and render
- watch projectiles render
- trigger level-up and select a choice
- confirm restart after death works

## Non-Goals

- final art polish
- advanced effects pipeline
- complex menu architecture

## Coordination Notes

The bridge is an adapter layer, not gameplay logic. If business logic drifts into `src/client/**`, surface it as a coordination issue.
