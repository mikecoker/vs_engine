# Sim Data Layout

## Purpose

This file defines how gameplay data should be stored in memory and passed between systems.

## Primary Principle

Hot gameplay data should live in contiguous typed arrays.

Do not default to:
- one object per enemy
- one object per projectile
- nested arrays of component objects

Prototype-scale counts can tolerate some object usage in cold paths, but not in the main update loops.

## Entity Handle Rules

All dynamic stores should use stable handles.

Suggested types:

```ts
export type EntityId = number;
export type EntityGeneration = number;

export interface EntityHandle {
  id: EntityId;
  gen: EntityGeneration;
}
```

Rules:
- `id` is the slot index
- `gen` increments when a slot is reused
- external references must validate generation before use

## Store Design Pattern

Each dynamic store should use:
- `capacity`
- `activeCount`
- `alive[]`
- `generation[]`
- `freeList[]`
- typed arrays for hot state

Each store should provide:
- `allocate()`
- `release(index)`
- `isAlive(index)`
- `validate(handle)`
- `grow(nextCapacity)`

## Required Stores

### `PlayerStore`

File target:
- `src/sim/player/PlayerStore.ts`

Suggested fields:
- `exists: boolean`
- `posX: number`
- `posY: number`
- `velX: number`
- `velY: number`
- `radius: number`
- `hp: number`
- `maxHp: number`
- `invulnRemaining: number`
- `pickupRadius: number`
- `facingX: number`
- `facingY: number`

The player can be a compact object rather than a typed-array store because only one player exists, but its runtime stat snapshot should still be formalized.

### `EnemyStore`

File target:
- `src/sim/enemies/EnemyStore.ts`

Required hot fields:
- `alive: Uint8Array`
- `generation: Uint16Array`
- `archetypeId: Uint16Array`
- `posX: Float32Array`
- `posY: Float32Array`
- `velX: Float32Array`
- `velY: Float32Array`
- `radius: Float32Array`
- `hp: Float32Array`
- `maxHp: Float32Array`
- `moveSpeed: Float32Array`
- `contactDamage: Float32Array`
- `xpValue: Uint16Array`
- `flags: Uint32Array`

### `ProjectileStore`

File target:
- `src/sim/projectiles/ProjectileStore.ts`

Required hot fields:
- `alive: Uint8Array`
- `generation: Uint16Array`
- `projectileTypeId: Uint16Array`
- `ownerTeam: Uint8Array`
- `posX: Float32Array`
- `posY: Float32Array`
- `velX: Float32Array`
- `velY: Float32Array`
- `radius: Float32Array`
- `damage: Float32Array`
- `remainingLife: Float32Array`
- `remainingPierce: Int16Array`
- `flags: Uint32Array`

### `PickupStore`

File target:
- `src/sim/pickups/PickupStore.ts`

Required hot fields:
- `alive: Uint8Array`
- `generation: Uint16Array`
- `pickupTypeId: Uint16Array`
- `posX: Float32Array`
- `posY: Float32Array`
- `velX: Float32Array`
- `velY: Float32Array`
- `radius: Float32Array`
- `value: Uint16Array`
- `magnetized: Uint8Array`

### `WeaponRuntimeStore`

File target:
- `src/sim/combat/WeaponRuntimeStore.ts`

Required fields for the prototype:
- `weaponTypeId[]`
- `weaponLevel[]`
- `cooldownRemaining[]`
- `projectileCountBonusApplied[]` or derive from player stats

Since only the player owns weapons in the first slice, this may be a compact array on the player runtime instead of a full dynamic pool.

### `ProgressionStore`

File target:
- `src/sim/progression/ProgressionStore.ts`

Required fields:
- `level`
- `xp`
- `xpToNext`
- `queuedLevelUps`
- `rerollsRemaining` if planned
- `banishesRemaining` if planned

## Hot/Cold Split

Hot data:
- positions
- velocities
- hit radii
- hp
- cooldowns
- lifetimes
- active flags

Cold data:
- display names
- descriptions
- sprite keys
- icon IDs
- long-form UI text
- unlock metadata

Hot loops should work from IDs into validated content tables, not from large nested content objects.

## Command Buffer Layout

Create dedicated buffers rather than one mixed `any[]`.

Suggested files:
- `src/sim/core/commands/EnemySpawnBuffer.ts`
- `src/sim/core/commands/ProjectileSpawnBuffer.ts`
- `src/sim/core/commands/DamageBuffer.ts`
- `src/sim/core/commands/PickupSpawnBuffer.ts`
- `src/sim/core/commands/XpGrantBuffer.ts`
- `src/sim/core/commands/StateChangeBuffer.ts`

Prototype implementation options:
- reusable arrays of small objects
- typed-array-backed ring buffers

For the first pass, reusable arrays of fixed-shape records are acceptable if they are cleared and reused rather than recreated each frame.

## Spatial Grid Layout

File target:
- `src/sim/spatial/SpatialGrid.ts`

Use a uniform grid.

Required responsibilities:
- convert world positions to cell coordinates
- clear and rebuild enemy occupancy each tick
- support neighbor-cell queries
- optionally support projectile and pickup queries later

Suggested initial layout:
- `cellSize: number`
- `widthInCells` optional if using bounded arena
- hash map or packed integer cell key for sparse layout
- reusable bucket arrays

For the prototype, a sparse map from cell key to reusable integer index arrays is acceptable if bucket arrays are recycled.

## Render Extraction Layout

The render layer should read:
- active counts
- dense transform views
- type IDs
- HUD scalar values
- run state

File targets:
- `src/sim/core/RenderSnapshot.ts`
- `src/sim/core/RenderExtract.ts`

Rules:
- no deep cloning of all store data each frame
- expose compact read-only views or a reusable snapshot object
- client code must treat these views as immutable

## Allocation Policy

Allowed:
- rare capacity growth
- cold-path content parsing allocations
- UI allocations outside hot gameplay loops

Not allowed:
- per-hit object creation in the projectile collision path
- per-enemy lambda allocations inside update loops
- fresh array filtering or mapping inside hot systems
