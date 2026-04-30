# Sim Integration Contracts

## Purpose

This file defines the contracts between the simulation layer and the Cocos client layer.

## Import Boundary

- `src/client/**` may import from `src/sim/**`
- `src/sim/**` must not import from `src/client/**`

## Sim Entry Points

Required file targets:
- `src/sim/core/Sim.ts`
- `src/sim/core/SimApi.ts`

The sim API should expose:
- `createSim(config, content, seed)`
- `step(frameSeconds, inputFrame)`
- `resetRun(seed?)`
- `setRunState(nextState)`
- `getRenderSnapshot()`
- `getDebugSnapshot()`

## Input Contract

Create a sim-facing input frame type.

File target:
- `src/sim/core/SimInput.ts`

Required shape:
- `moveX: number`
- `moveY: number`
- `pausePressed: boolean`
- `confirmPressed: boolean`
- `cancelPressed: boolean`
- `debugGrantXpPressed?: boolean`
- `debugSpawnWavePressed?: boolean`

Rules:
- raw device input stays in client code
- the client converts device state into `SimInput`
- the sim only knows about normalized gameplay input

## Render Contract

Create a read-only render snapshot contract.

File target:
- `src/sim/core/RenderSnapshot.ts`

The snapshot should expose:
- current `runState`
- player position and hp
- enemy count plus enemy position/type views
- projectile count plus projectile position/type views
- pickup count plus pickup position/type views
- elapsed run time
- current level and XP HUD values

The snapshot should not expose:
- mutable store internals for writing
- Cocos nodes
- client-owned transient animation state

## Content Contract

Content should be loaded before sim creation and passed into the sim as validated definitions.

File targets:
- `src/sim/content/ContentRegistry.ts`
- `src/sim/content/ContentTypes.ts`

The sim should consume:
- enemy archetype defs
- weapon defs
- passive defs
- pickup defs
- player character defs
- progression curves
- wave defs

The sim should consume them by durable IDs, not display strings.

## Level-Up Contract

The sim owns the fact that level-up occurred.

The client owns the display of the choice UI.

Flow:
1. sim detects threshold crossed
2. sim increments queued level-up count
3. sim enters `levelup_choice` state
4. client reads choice payload from sim
5. client sends selected upgrade choice back through a sim API call
6. sim applies upgrade and resumes running when appropriate

Required file targets:
- `src/sim/progression/UpgradeChoice.ts`
- `src/sim/progression/ProgressionApi.ts`

## Debug Contract

Required file targets:
- `src/sim/debug/DebugSnapshot.ts`
- `src/sim/debug/DebugCommands.ts`

The client may display or trigger:
- active enemy count
- projectile count
- pickup count
- recent tick time or estimated step duration
- grant XP
- spawn test wave
- kill all enemies

## Save Contract

The first prototype may defer full save implementation, but the contract should already separate:
- run state
- persistent meta state
- content registry IDs

File targets:
- `src/sim/content/SaveData.ts`
- `src/client/cocos/persistence/SaveRepository.ts`

Rules:
- the sim should produce serializable plain data
- the client persistence layer writes that data using platform-specific storage

## Test Contract

The test harness should be able to:
- construct the sim with content
- feed deterministic input frames
- step fixed numbers of ticks
- inspect snapshot or store state

Required file targets:
- `tests/sim/createTestSim.ts`
- `tests/sim/helpers/stepSim.ts`

## Adapter Rule

If the client wants a convenience wrapper, place it in:
- `src/client/cocos/SimSceneBridge.ts`

It may:
- convert Cocos input to `SimInput`
- step the sim during scene update
- push snapshot data into render presenters

It may not:
- resolve gameplay damage
- advance progression directly
- authoritatively spawn enemies without going through sim APIs
