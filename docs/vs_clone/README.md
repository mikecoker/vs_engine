# Vampire Survivors-Style Clone Implementation Plan

This folder is a coordination layer for building a Vampire Survivors-style game with parallel workers.

Use [00-overview.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/00-overview.md) first. It defines:
- target slice
- system boundaries
- ownership rules
- delivery order
- integration contracts

Then read the sim foundation docs:
- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

Then use [01-agent-assignment-matrix.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/01-agent-assignment-matrix.md) to launch workers with the ready-to-send prompts, and assign each worker its task file from `tasks/`.

Suggested first implementation slice:
- player movement
- enemy chase AI
- one auto-fire weapon
- contact and projectile damage
- XP drops and pickups
- level-up choice flow
- simple wave spawning
- HUD and pause/state flow

Files:
- [00-overview.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/00-overview.md)
- [01-agent-assignment-matrix.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/01-agent-assignment-matrix.md)
- [02-merge-checkpoints.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/02-merge-checkpoints.md)
- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)
- [tasks/01-core-loop-and-state.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/01-core-loop-and-state.md)
- [tasks/02-player-and-stats.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/02-player-and-stats.md)
- [tasks/03-enemy-director-and-ai.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/03-enemy-director-and-ai.md)
- [tasks/04-combat-and-hit-processing.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/04-combat-and-hit-processing.md)
- [tasks/05-progression-and-upgrades.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/05-progression-and-upgrades.md)
- [tasks/06-meta-content-data-and-save.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/06-meta-content-data-and-save.md)
- [tasks/07-ui-ux-and-run-presentation.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/07-ui-ux-and-run-presentation.md)
- [tasks/08-performance-tooling-and-test-harness.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/tasks/08-performance-tooling-and-test-harness.md)
