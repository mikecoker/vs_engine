# Task 04: Weapons, Projectiles, And Damage Resolution

## Purpose

Implement the prototype combat loop:
- weapon cooldowns
- projectile spawning
- projectile movement
- collision queries
- damage resolution

## Ownership

Primary write scope:
- `src/sim/combat/**`
- `src/sim/projectiles/**`

Allowed shared contract scope:
- `src/sim/core/RenderSnapshot.ts`

Do not edit:
- `src/sim/player/**`
- `src/sim/enemies/**`
- `src/sim/progression/**`
- `src/client/**`

## Read First

- [03-sim-architecture.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/03-sim-architecture.md)
- [04-sim-data-layout.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/04-sim-data-layout.md)
- [05-sim-integration-contracts.md](/Users/mikecoker/projects/vs_engine/docs/vs_clone/05-sim-integration-contracts.md)

## Objective

Build a data-driven combat path that can support at least:
- one auto-fire projectile weapon
- one basic projectile type
- enemy hit detection using the spatial grid
- contact damage against player
- enemy death consequences emitted as commands

## Required File Targets

- `src/sim/combat/WeaponRuntimeStore.ts`
- `src/sim/combat/WeaponFireSystem.ts`
- `src/sim/combat/WeaponTargeting.ts`
- `src/sim/combat/DamageTypes.ts`
- `src/sim/combat/DamageResolveSystem.ts`
- `src/sim/combat/ContactDamageQuerySystem.ts`
- `src/sim/projectiles/ProjectileStore.ts`
- `src/sim/projectiles/ProjectileSpawnSystem.ts`
- `src/sim/projectiles/ProjectileMovementSystem.ts`
- `src/sim/projectiles/ProjectileHitQuerySystem.ts`
- `src/sim/projectiles/ProjectileLifecycle.ts`

## Concrete Responsibilities

1. Define player-owned weapon runtime slots.
   For prototype scope, weapons belong only to the player.

2. Implement basic target selection.
   Minimum mode:
   - nearest enemy in range or globally nearest enemy

3. Implement weapon cooldown stepping and fire requests.
   The system should emit projectile spawn commands rather than creating projectiles directly in unrelated systems.

4. Implement projectile storage and movement.
   Projectiles should have lifetime, radius, damage, and optional pierce count.

5. Implement collision with enemies using the spatial grid.
   Avoid naive all-projectiles to all-enemies loops if possible.

6. Implement contact damage queries.
   Enemies overlapping player should enqueue player damage.

7. Implement damage resolution.
   Damage application should support:
   - player damage
   - enemy damage
   - death detection
   - kill-source consequences via commands

## Implementation Steps

1. Add weapon runtime state representation.
2. Add nearest-target lookup helper using active enemy store data.
3. Add auto-fire system with cooldown countdown.
4. Add projectile spawn apply path.
5. Add projectile movement path and lifetime expiry.
6. Add projectile-enemy overlap checks via grid query.
7. Add contact damage player query.
8. Add centralized damage resolve system.
9. Emit pickup or XP-related consequence commands on enemy death.
10. Expose projectile render data through render extraction.

## Interfaces To Produce

- `WeaponRuntimeStore`
- `stepWeaponFire(context)`
- `spawnProjectilesFromCommands(context)`
- `stepProjectileMovement(context)`
- `queryProjectileHits(context)`
- `queryContactDamage(context)`
- `resolveDamage(context)`

## Interfaces To Consume

- player stat snapshot from Worker 2
- enemy store and spatial grid from Worker 3
- weapon and projectile defs from Worker 6

## Acceptance Criteria

- the player can auto-fire repeatedly at a valid cadence
- projectiles move and expire
- projectiles can damage and kill enemies
- contact overlap can damage the player
- enemy death results in downstream pickup or XP consequences through commands
- combat hot loops avoid per-hit allocations

## Tests To Add

- weapon cooldown reaches fire threshold deterministically
- target selection returns nearest valid enemy
- projectile movement advances correctly
- projectile hit reduces enemy hp
- enemy death emits the expected follow-up command
- contact overlap damages player once per allowed interval

Suggested files:
- `tests/sim/combat/weapon-fire.test.ts`
- `tests/sim/projectiles/projectile-movement.test.ts`
- `tests/sim/projectiles/projectile-hit.test.ts`
- `tests/sim/combat/contact-damage.test.ts`
- `tests/sim/combat/damage-resolve.test.ts`

## Manual Verification

- spawn a player with one weapon
- spawn several enemies
- observe projectiles firing and killing enemies
- move into enemies and confirm player hp decreases

## Non-Goals

- complex status effects
- multi-owner projectile systems
- exotic weapon behaviors

## Coordination Notes

Worker 5 will depend on weapon IDs and upgrade application points. Keep weapon runtime slots simple and data-driven.
