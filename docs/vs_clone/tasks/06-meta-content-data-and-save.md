# Task 06: Content Definitions, Validation, And Save-Ready IDs

## Purpose

Provide the data layer that allows the sim to be driven by definitions instead of scattered hardcoded values.

## Ownership

Primary write scope:
- `src/sim/content/**`

Do not edit:
- `src/sim/player/**`
- `src/sim/enemies/**`
- `src/sim/combat/**`
- `src/sim/progression/**`
- `src/client/**` except if a save contract file is explicitly shared

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Objective

Implement:
- stable content ID types
- content definition contracts
- validation/loading path
- starter prototype data
- basic save-data shape definitions

## Required File Targets

- `src/sim/content/ContentIds.ts`
- `src/sim/content/ContentTypes.ts`
- `src/sim/content/ContentRegistry.ts`
- `src/sim/content/ContentLoader.ts`
- `src/sim/content/ContentValidation.ts`
- `src/sim/content/defs/*`
- `src/sim/content/SaveData.ts`

## Concrete Responsibilities

1. Define durable IDs.
   Use IDs like:
   - `player.witch`
   - `enemy.bat`
   - `weapon.magic_bolt`
   - `pickup.xp_small`

2. Define runtime-consumable content contracts.
   Required definition groups:
   - player character defs
   - enemy archetype defs
   - weapon defs
   - projectile defs
   - passive upgrade defs
   - pickup defs
   - progression curve defs
   - wave defs

3. Implement validation.
   Invalid references should fail during development rather than causing runtime null behavior.

4. Create starter prototype content.
   Minimum:
   - one player
   - three enemies
   - three weapons
   - one projectile type
   - one XP pickup
   - one progression curve
   - one wave script
   - six passive upgrades

5. Define save-ready meta data shapes.
   Full persistence can wait, but serializable structures must be defined cleanly.

## Implementation Steps

1. Add content ID type helpers.
2. Add definition interfaces.
3. Add registry object with typed lookup helpers.
4. Add validation pass for duplicate IDs and broken references.
5. Add starter defs with placeholder numeric values.
6. Add save data interfaces for unlock-ready state and settings-ready state.

## Interfaces To Produce

- content ID helpers
- typed definition interfaces
- validated `ContentRegistry`
- starter definition set
- serializable save data shapes

## Interfaces To Consume

This worker should not depend heavily on runtime system implementation details.

Coordinate with:
- Worker 2 for player base stats
- Worker 3 for enemy archetype fields
- Worker 4 for weapon/projectile fields
- Worker 5 for upgrade/pool fields

## Acceptance Criteria

- all prototype content is defined through typed defs
- cross-references validate
- runtime workers can consume content by ID lookup
- no system depends on display names as keys

## Tests To Add

- duplicate content IDs fail validation
- invalid cross-reference fails validation
- registry can resolve prototype defs by ID

Suggested files:
- `tests/sim/content/content-validation.test.ts`
- `tests/sim/content/content-registry.test.ts`

## Manual Verification

- load the registry in a test bootstrap
- inspect prototype defs
- intentionally break one reference and confirm validation fails

## Non-Goals

- polished balance values
- content pipeline tooling beyond basic typed loading
- full persistence implementation

## Coordination Notes

All workers depend on these definitions. Prioritize stable field names and durable IDs over completeness.
