# Overview

## Stack Decision

This plan assumes:
- `Cocos Creator`
- `TypeScript`
- pure `2D` presentation
- single-player only for the first implementation
- a custom simulation runtime inspired by ECS patterns, but not a full generic ECS

## Goal

Build a Vampire Survivors-style game where:
- gameplay truth lives in a headless-friendly simulation layer
- Cocos acts as the shell for rendering, input, UI, and audio
- the first vertical slice remains playable at prototype-scale entity counts
- the codebase is split so multiple workers can implement in parallel without constant merge collisions

## Performance Targets

The first architecture pass should target:
- `60 Hz` fixed-step simulation
- `300-500` visible enemies on desktop hardware
- `1000-2000` total active simulated objects including enemies, projectiles, pickups, and transient effects
- `0` intentional allocations in hot loops

These are planning targets, not a guarantee. Worker task docs should treat them as constraints.

## Core Technical Position

Do not build a full generic archetype ECS.

Build a specialized data-oriented simulation with:
- typed-array-backed hot data stores
- stable entity handles
- fixed-step system order
- command buffers for structural changes
- a spatial grid for broadphase queries
- a clean render extraction boundary

## Runtime Boundary

Simulation code should live under:
- `src/sim/**`

Client, Cocos, and presentation code should live under:
- `src/client/**`

Hard rule:
- `src/sim/**` must not import Cocos engine types
- `src/client/**` may import simulation types and read-only snapshots

## Proposed Project Layout

- `src/sim/core`
- `src/sim/world`
- `src/sim/player`
- `src/sim/enemies`
- `src/sim/combat`
- `src/sim/projectiles`
- `src/sim/pickups`
- `src/sim/progression`
- `src/sim/spatial`
- `src/sim/content`
- `src/sim/debug`
- `src/client/cocos`
- `src/client/render`
- `src/client/input`
- `src/client/ui`
- `tests/sim`

## Foundation Docs

Read these before assigning feature workers:
- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Worker Assignment

Recommended ownership split:
- Worker 1: sim core, world boot, run state, command buffers
- Worker 2: player runtime, stats, input application, pickup magnet baseline
- Worker 3: enemy runtime, spawn director, enemy movement
- Worker 4: combat runtime, weapons, projectiles, damage pipeline
- Worker 5: progression runtime, XP, levels, upgrades
- Worker 6: content defs, schema validation, save-ready content IDs
- Worker 7: Cocos bridge, render sync, HUD shell, level-up UI shell
- Worker 8: sim tests, deterministic harness, performance counters, debug cheats

Workers are not alone in the codebase. They should not revert other edits and should adapt to shared contracts where reasonable.

## Vertical Slice Scope

The first playable milestone should support:
- one arena
- one player character
- one enemy movement behavior
- three enemy archetypes
- one auto-fire projectile weapon
- XP drops and collection
- level-up pause flow
- three weapon definitions
- six passive upgrades
- death and restart

## Delivery Order

Implement in this sequence:
1. sim core and content contracts
2. player and enemy movement baseline
3. projectiles and damage
4. XP and level-up loop
5. render sync and basic UI shell
6. test harness and debug tooling hardening

## Definition Of Done For Prototype Slice

The slice is done when:
- the simulation can boot, step, pause, resume, fail, and restart
- the player can survive at least 60 seconds against repeated enemy spawns
- projectiles can kill enemies and spawn XP pickups
- XP collection can trigger at least one level-up
- the UI can present a level-up state without sim corruption
- the render layer is downstream from sim state and not the source of truth
- there is at least one deterministic smoke test covering spawn, kill, XP, and restart

## File Map

Coordination docs:
- [01-agent-assignment-matrix.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/01-agent-assignment-matrix.md)
- [02-merge-checkpoints.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/02-merge-checkpoints.md)

Foundation docs:
- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

Implementation briefs:
- [tasks/01-core-loop-and-state.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/01-core-loop-and-state.md)
- [tasks/02-player-and-stats.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/02-player-and-stats.md)
- [tasks/03-enemy-director-and-ai.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/03-enemy-director-and-ai.md)
- [tasks/04-combat-and-hit-processing.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/04-combat-and-hit-processing.md)
- [tasks/05-progression-and-upgrades.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/05-progression-and-upgrades.md)
- [tasks/06-meta-content-data-and-save.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/06-meta-content-data-and-save.md)
- [tasks/07-ui-ux-and-run-presentation.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/07-ui-ux-and-run-presentation.md)
- [tasks/08-performance-tooling-and-test-harness.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/08-performance-tooling-and-test-harness.md)
