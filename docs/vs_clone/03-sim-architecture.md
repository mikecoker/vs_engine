# Sim Architecture

## Purpose

This file defines the simulation architecture for the project. All feature workers should follow it before adding system-specific code.

## Non-Negotiable Rules

1. `src/sim/**` must not import Cocos engine modules.
2. The simulation is the source of truth for gameplay state.
3. Rendering reads sim state. Rendering does not own gameplay truth.
4. The sim runs on a fixed timestep.
5. Hot-path systems should not allocate each frame.
6. Structural changes happen through command buffers, not mid-iteration mutation.

## Main Runtime Objects

### `Sim`

Responsibilities:
- own the fixed-step loop entry point
- own `RunState`
- own the top-level `World`
- sequence all systems in a stable order
- expose read-only render extraction

Required file targets:
- `src/sim/core/Sim.ts`
- `src/sim/core/RunState.ts`
- `src/sim/core/SimConfig.ts`

### `World`

Responsibilities:
- aggregate all specialized stores
- aggregate command buffers
- hold shared services like RNG and spatial grid
- expose reset and initialization paths

Required file targets:
- `src/sim/world/World.ts`
- `src/sim/world/WorldFactory.ts`

### `FrameContext`

Responsibilities:
- provide a stable input to each system per tick
- expose `tick`, `dt`, `elapsed`, `rng`, `config`, and store references

Required file targets:
- `src/sim/core/FrameContext.ts`

## Fixed-Step Model

Use:
- `fixedStepSeconds = 1 / 60`
- variable render frame input from Cocos
- accumulator-driven stepping
- a cap on maximum substeps per rendered frame to avoid spiral-of-death behavior

Expected behavior:
- if frame time spikes, multiple sim ticks may run
- if too many would run, clamp and drop excess accumulated time with a debug warning

## System Order

Every tick should execute in this order:

1. `RunStateSystem`
2. `InputApplySystem`
3. `SpawnDirectorSystem`
4. `ApplySpawnCommandsSystem`
5. `PlayerMovementSystem`
6. `EnemyMovementSystem`
7. `WeaponFireSystem`
8. `ProjectileMovementSystem`
9. `SpatialGridBuildSystem`
10. `ContactDamageQuerySystem`
11. `ProjectileHitQuerySystem`
12. `DamageResolveSystem`
13. `DeathAndDropSystem`
14. `PickupMagnetSystem`
15. `PickupCollectSystem`
16. `ProgressionSystem`
17. `CleanupSystem`
18. `RenderExtractSystem`

Workers may add later systems, but should preserve the discipline:
- movement before collision queries
- collision queries before damage resolution
- progression after XP collection
- cleanup after all gameplay consequences have been emitted

## Data Ownership

The sim should use specialized stores, not a generic component bag.

Required stores:
- `PlayerStore`
- `EnemyStore`
- `ProjectileStore`
- `PickupStore`
- `WeaponRuntimeStore`
- `ProgressionStore`
- `SpatialGrid`
- `DebugCounters`

## Eventing Model

Do not use a fully dynamic pub/sub event bus in the hot path.

Use:
- command buffers for structural changes and gameplay requests
- compact queues for low-volume state changes that UI or debug tools may observe

Safe uses for low-volume event queues:
- level-up reached
- run state changed
- player died
- upgrade applied

Unsafe hot-path use:
- allocating event objects per projectile hit

## Command Buffer Policy

Required command categories:
- spawn enemy
- despawn enemy
- spawn projectile
- despawn projectile
- apply damage
- spawn pickup
- collect pickup
- grant XP
- request run state change

Rules:
- systems enqueue commands
- command application happens at controlled sync points
- systems must not splice or resize active collections while iterating them

## Simulation Versus Presentation

The sim should output a compact render-facing snapshot or read-only view.

The snapshot must contain enough data to render:
- player transform
- active enemy transforms and type IDs
- active projectile transforms and type IDs
- active pickup transforms and type IDs
- current HUD numbers
- run state

The snapshot must not contain:
- Cocos node references
- sprite instances
- engine-specific animation objects

## Randomness

The sim must own a seeded RNG.

Requirements:
- all gameplay randomness routes through sim RNG
- wave picks, loot variation, and upgrade rolls must not use `Math.random()` directly
- the RNG seed must be configurable at run start

## Headless Testability

The sim should be runnable in tests without a renderer.

That means:
- no engine imports in sim
- no wall-clock reads inside systems
- no hard dependency on UI flow to continue runtime state

## Prototype Scope Rules

For the first implementation:
- only one player entity exists
- standard enemies use chase behavior only
- collisions are circles only
- no navmesh, no rigidbody simulation, no skeletal combat logic

## Open Upgrade Path

This architecture should leave room for:
- more weapon families
- more enemy behaviors
- more pickups
- future replay or network experiments

Do not add those abstractions now unless they are needed for the prototype contracts.
