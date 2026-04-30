# Merge Checkpoints

## Purpose

This file defines when branches should merge, what must be true before merge, and how to keep parallel workers from colliding once implementation starts.

## Branch Strategy

Recommended branch shape:
- `main`
- `feat/core-shell`
- `feat/content-schema`
- `feat/tools-harness`
- `feat/player-runtime`
- `feat/enemy-runtime`
- `feat/combat-runtime`
- `feat/progression-runtime`
- `feat/ui-runtime`

If you use subagents, give each one exactly one branch and one owned write scope.

## Merge Gate 0: Contract Draft

Owners:
- Worker 1
- Worker 6
- Worker 8

Required before merge:
- shared core types exist
- event names and payload draft exist
- content IDs and schema draft exist
- test harness can boot the runtime or a stub shell

Do not merge if:
- event payloads are still changing every commit
- content IDs are not yet durable
- the sim entry point is missing

Why this gate matters:
- every later worker will otherwise code against assumptions and create rework

## Merge Gate 1: First Runtime Integration

Owners:
- Worker 2
- Worker 3
- Worker 4

Required before merge:
- player can spawn and move
- enemy spawner can create hostile entities
- at least one weapon can trigger automatically
- combat can damage enemies and player
- enemy death can emit a drop request or XP event

Do not merge if:
- player and enemy coordinates use incompatible spaces
- combat reaches directly into private player or enemy state
- gameplay only works through UI-side hacks

Why this gate matters:
- it proves the runtime model is viable before progression builds on it

## Merge Gate 2: Progression Loop

Owners:
- Worker 5
- Worker 7

Required before merge:
- XP collection increments progression state
- at least one level-up pauses or overlays the run cleanly
- upgrade choices render and can be selected
- selecting an upgrade changes runtime behavior

Do not merge if:
- level-up logic lives only in UI
- upgrades are hardcoded in view components
- pause and level-up states corrupt the run

Why this gate matters:
- it creates the compounding-build loop that defines the genre

## Merge Gate 3: Persistence And Scale

Owners:
- Worker 6
- Worker 8

Required before merge:
- save data persists settings and unlock-ready state
- starter content is fully data-driven
- stress tools report entity and projectile counts
- smoke tests cover start, kill, level-up, death, and restart

Do not merge if:
- content additions still require editing core switch statements
- test harness cannot reproduce basic failures
- performance metrics are absent in dense scenarios

Why this gate matters:
- it determines whether the prototype can evolve into a maintainable game

## Merge Cadence

Recommended cadence:
- merge contract work first
- merge runtime vertical slice next
- merge progression and UI after one integrated playtest
- merge persistence and tooling after the slice is stable

Avoid long-lived branches once shared contracts stabilize. Feature branches should rebase or merge from the latest integration branch frequently.

## Conflict Rules

When two workers need the same shared file:
- the contract owner edits it
- the feature worker proposes the smallest change needed
- the contract owner merges or applies the change

When a worker is blocked by an unstable interface:
- they should stub against the latest agreed contract
- they should not fork the interface privately inside their feature area

When a worker needs to touch another area:
- only touch the shared contract file if possible
- otherwise stop and coordinate before editing outside ownership

## Review Checklist Per Merge

Use this checklist on every integration PR:
- write scope stayed inside the assigned boundary
- no unrelated files were reformatted or rewritten
- new events and types are documented
- feature behavior is not duplicated across systems
- integration path has at least one smoke test or manual verification note
- performance-sensitive code avoids obvious all-to-all loops where counts will grow

## Playtest Checkpoints

Run a short manual playtest after each gate:

### After Gate 1
- can move
- can survive for 30 to 60 seconds
- enemies can die repeatedly

### After Gate 2
- can gain several levels
- at least two upgrade choices visibly alter the run
- pause, level-up, and death do not break restart

### After Gate 3
- can complete a 10 to 15 minute run target or a scaled-down equivalent
- frame-time remains stable under the expected first-slice population
- save/load preserves at least settings and unlock-relevant state

## Escalation Rules

Escalate to the coordinator when:
- a shared contract needs incompatible changes
- two workers need the same runtime ownership area
- performance fixes require architectural changes outside one worker scope
- content schema changes would invalidate already-authored data

## Suggested Coordinator Routine

At the start of each batch:
- confirm active owners and write scopes
- freeze the shared contract version for that batch
- define the exact merge gate target

At the end of each batch:
- integrate branches in dependency order
- run smoke checks
- update task docs with any contract drift
