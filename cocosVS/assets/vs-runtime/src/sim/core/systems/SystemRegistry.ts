import { SYSTEM_ORDER, type SystemName } from "../../debug/DebugSnapshot.ts";
import { queryContactDamage } from "../../combat/ContactDamageQuerySystem.ts";
import { resolveDamage } from "../../combat/DamageResolveSystem.ts";
import { stepWeaponFire } from "../../combat/WeaponFireSystem.ts";
import { stepEnemyMovement } from "../../enemies/EnemyMovementSystem.ts";
import { applyEnemySpawnCommands } from "../../enemies/EnemySpawnSystem.ts";
import { stepSpawnDirectorSystem } from "../../enemies/SpawnDirectorSystem.ts";
import { queryProjectileHits } from "../../projectiles/ProjectileHitQuerySystem.ts";
import { stepProjectileMovement } from "../../projectiles/ProjectileMovementSystem.ts";
import { applyPickupSpawnCommands } from "../../pickups/PickupSpawnSystem.ts";
import { stepHealthPickupSpawner } from "../../pickups/HealthPickupSpawnSystem.ts";
import { stepMagnetPickupSpawner } from "../../pickups/MagnetPickupSpawnSystem.ts";
import { stepPickupMagnetSystem } from "../../pickups/PickupMagnetSystem.ts";
import { stepPickupCollectSystem } from "../../pickups/PickupCollectSystem.ts";
import { stepPlayerMovement } from "../../player/PlayerMovementSystem.ts";
import { stepProgression } from "../../progression/ProgressionSystem.ts";
import { rebuildSpatialGrid } from "../../spatial/SpatialGridBuildSystem.ts";
import type { FrameContext } from "../FrameContext.ts";
import { inputApplySystem } from "./InputApplySystem.ts";
import { runStateSystem } from "./RunStateSystem.ts";

export type SystemPhase = "always" | "gameplay";

export interface SimSystem {
  readonly name: SystemName;
  readonly phase: SystemPhase;
  execute(context: FrameContext): void;
}

const NO_OP_SYSTEMS: ReadonlySet<SystemName> = new Set([
  "DeathAndDropSystem",
  "CleanupSystem",
  "RenderExtractSystem",
]);

const GAMEPLAY_EXECUTORS: Readonly<Record<string, (context: FrameContext) => void>> = {
  SpawnDirectorSystem: stepSpawnDirectorSystem,
  ApplySpawnCommandsSystem: applyEnemySpawnCommands,
  PlayerMovementSystem: stepPlayerMovement,
  EnemyMovementSystem: stepEnemyMovement,
  WeaponFireSystem: stepWeaponFire,
  ProjectileMovementSystem: stepProjectileMovement,
  SpatialGridBuildSystem: rebuildSpatialGrid,
  ContactDamageQuerySystem: queryContactDamage,
  ProjectileHitQuerySystem: queryProjectileHits,
  DamageResolveSystem: resolveDamage,
  PickupMagnetSystem: stepPickupMagnetSystem,
  PickupCollectSystem: stepPickupCollectSystem,
  ProgressionSystem: stepProgression,
};

function resolvePhase(name: SystemName): SystemPhase {
  return name === "RunStateSystem" || name === "InputApplySystem" || name === "RenderExtractSystem"
    ? "always"
    : "gameplay";
}

function resolveExecutor(name: SystemName): (context: FrameContext) => void {
  switch (name) {
    case "RunStateSystem":
      return runStateSystem;
    case "InputApplySystem":
      return inputApplySystem;
    case "ApplySpawnCommandsSystem":
      return (context) => {
        stepHealthPickupSpawner(context);
        stepMagnetPickupSpawner(context);
        applyEnemySpawnCommands(context);
        applyPickupSpawnCommands(context);
      };
    default: {
      const executor = GAMEPLAY_EXECUTORS[name];
      if (executor) {
        return executor;
      }
      if (NO_OP_SYSTEMS.has(name)) {
        return () => {};
      }
      return () => {};
    }
  }
}

export function createSystemPipeline(): readonly SimSystem[] {
  return SYSTEM_ORDER.map((name) => ({
    name,
    phase: resolvePhase(name),
    execute: resolveExecutor(name),
  }));
}
