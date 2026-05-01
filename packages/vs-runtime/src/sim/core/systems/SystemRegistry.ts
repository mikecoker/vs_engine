import { SYSTEM_ORDER, type SystemName } from "../../debug/DebugSnapshot";
import { queryContactDamage } from "../../combat/ContactDamageQuerySystem";
import { resolveDamage } from "../../combat/DamageResolveSystem";
import { stepWeaponFire } from "../../combat/WeaponFireSystem";
import { stepEnemyMovement } from "../../enemies/EnemyMovementSystem";
import { applyEnemySpawnCommands } from "../../enemies/EnemySpawnSystem";
import { stepSpawnDirectorSystem } from "../../enemies/SpawnDirectorSystem";
import { queryProjectileHits } from "../../projectiles/ProjectileHitQuerySystem";
import { stepProjectileMovement } from "../../projectiles/ProjectileMovementSystem";
import { applyPickupSpawnCommands } from "../../pickups/PickupSpawnSystem";
import { stepPickupMagnetSystem } from "../../pickups/PickupMagnetSystem";
import { stepPickupCollectSystem } from "../../pickups/PickupCollectSystem";
import { stepPlayerMovement } from "../../player/PlayerMovementSystem";
import { stepProgression } from "../../progression/ProgressionSystem";
import { rebuildSpatialGrid } from "../../spatial/SpatialGridBuildSystem";
import type { FrameContext } from "../FrameContext";
import { inputApplySystem } from "./InputApplySystem";
import { runStateSystem } from "./RunStateSystem";

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
