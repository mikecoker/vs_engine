import type { DebugSnapshot, SystemName } from "../debug/DebugSnapshot";
import { SYSTEM_ORDER } from "../debug/DebugSnapshot";
import { extractDebugCommandFrame } from "../debug/DebugCommands";
import { extractRenderSnapshot } from "./RenderExtract";
import type { FrameContext } from "./FrameContext";
import type { RenderSnapshot } from "./RenderSnapshot";
import { RunState, canTransitionRunState, isSimulationAdvancingState } from "./RunState";
import { mergeSimConfig, type SimConfig } from "./SimConfig";
import { EMPTY_SIM_INPUT, type SimInput } from "./SimInput";
import type { SimApi, SimContent } from "./SimApi";
import { createWorldFactory } from "../world/WorldFactory";
import type { World } from "../world/World";
import { resetWorld } from "../world/WorldReset";
import { stepSpawnDirectorSystem } from "../enemies/SpawnDirectorSystem";
import { applyEnemySpawnCommands } from "../enemies/EnemySpawnSystem";
import { stepEnemyMovement } from "../enemies/EnemyMovementSystem";
import { rebuildSpatialGrid } from "../spatial/SpatialGridBuildSystem";
import { stepPlayerMovement } from "../player/PlayerMovementSystem";
import { initializePlayerForRun } from "../player/PlayerReset";
import { stepWeaponFire } from "../combat/WeaponFireSystem";
import { stepProjectileMovement } from "../projectiles/ProjectileMovementSystem";
import { queryContactDamage } from "../combat/ContactDamageQuerySystem";
import { queryProjectileHits } from "../projectiles/ProjectileHitQuerySystem";
import { resolveDamage } from "../combat/DamageResolveSystem";

type SystemPhase = "always" | "gameplay";

interface SimSystem {
  readonly name: SystemName;
  readonly phase: SystemPhase;
  execute(context: FrameContext): void;
}

function createSystemPipeline(): readonly SimSystem[] {
  return SYSTEM_ORDER.map((name) => ({
    name,
    phase:
      name === "RunStateSystem" || name === "InputApplySystem" || name === "RenderExtractSystem"
        ? "always"
        : "gameplay",
    execute(context: FrameContext) {
      switch (name) {
        case "RunStateSystem":
          runStateSystem(context);
          return;
        case "InputApplySystem":
          inputApplySystem(context);
          return;
        case "SpawnDirectorSystem":
          stepSpawnDirectorSystem(context);
          return;
        case "ApplySpawnCommandsSystem":
          applyEnemySpawnCommands(context);
          return;
        case "PlayerMovementSystem":
          stepPlayerMovement(context);
          return;
        case "EnemyMovementSystem":
          stepEnemyMovement(context);
          return;
        case "WeaponFireSystem":
          stepWeaponFire(context);
          return;
        case "ProjectileMovementSystem":
          stepProjectileMovement(context);
          return;
        case "SpatialGridBuildSystem":
          rebuildSpatialGrid(context);
          return;
        case "ContactDamageQuerySystem":
          queryContactDamage(context);
          return;
        case "ProjectileHitQuerySystem":
          queryProjectileHits(context);
          return;
        case "DamageResolveSystem":
          resolveDamage(context);
          return;
        default:
          return;
      }
    },
  }));
}

function runStateSystem(context: FrameContext): void {
  const { world } = context;

  const pendingCount = world.commands.stateChange.count;
  for (let index = 0; index < pendingCount; index += 1) {
    const command = world.commands.stateChange.get(index);
    applyRunState(world, command.nextState, command.reason);
  }
  world.commands.stateChange.clear();

  if (world.runState.current === RunState.StartingRun) {
    if (!world.stores.player.exists) {
      initializePlayerForRun(world.stores.player, world.content);
    }
    applyRunState(world, RunState.Running, "startup-complete");
  }
}

function inputApplySystem(context: FrameContext): void {
  const { frameInput, world } = context;

  world.scratch.latestMoveMagnitude = Math.hypot(frameInput.moveX, frameInput.moveY);

  if (frameInput.pausePressed) {
    if (world.runState.current === RunState.Running) {
      applyRunState(world, RunState.Paused, "pause-pressed");
    } else if (world.runState.current === RunState.Paused) {
      applyRunState(world, RunState.Running, "pause-resume");
    }
  }

  const debugCommandFrame = extractDebugCommandFrame(frameInput);
  if (debugCommandFrame.grantXp) {
    world.commands.xpGrant.enqueue(1);
  }

  if (debugCommandFrame.spawnWave) {
    world.commands.enemySpawn.enqueue(0, 0, 0);
  }
}

function applyRunState(world: World, nextState: RunState, reason: string): void {
  if (!canTransitionRunState(world.runState.current, nextState)) {
    return;
  }

  world.runState.current = nextState;
  world.debug.lastRunStateChangeReason = reason;
}

function createFrameContext(
  world: World,
  config: Readonly<SimConfig>,
  frameInput: Readonly<SimInput>,
): FrameContext {
  return {
    dt: config.fixedStepSeconds,
    tick: world.time.tick,
    elapsedSeconds: world.time.elapsedSeconds,
    frameInput,
    config,
    world,
  };
}

export class Sim implements SimApi {
  public readonly config: Readonly<SimConfig>;
  public get fixedStepSeconds(): number {
    return this.config.fixedStepSeconds;
  }

  private readonly content: SimContent;
  private readonly pipeline: readonly SimSystem[];
  private readonly worldFactory: ReturnType<typeof createWorldFactory>;

  private accumulatorSeconds = 0;
  private seed: number;

  private world: World;

  constructor(config: Partial<SimConfig> = {}, content: SimContent = {}, seed = 1) {
    this.config = mergeSimConfig(config);
    this.content = content;
    this.seed = seed >>> 0;
    this.pipeline = createSystemPipeline();
    this.worldFactory = createWorldFactory(this.config, this.content);
    this.world = this.worldFactory(this.seed, this.config.initialRunState);
  }

  public step(frameSeconds: number, inputFrame: Readonly<SimInput> = EMPTY_SIM_INPUT): number {
    const clampedFrameSeconds = Math.max(0, Math.min(frameSeconds, this.config.maxFrameSeconds));
    this.accumulatorSeconds += clampedFrameSeconds;

    let stepsExecuted = 0;
    while (
      this.accumulatorSeconds >= this.config.fixedStepSeconds &&
      stepsExecuted < this.config.maxSubstepsPerFrame
    ) {
      this.accumulatorSeconds -= this.config.fixedStepSeconds;
      this.executeTick(inputFrame);
      stepsExecuted += 1;
    }

    if (this.accumulatorSeconds >= this.config.fixedStepSeconds) {
      const droppedSubsteps = Math.floor(this.accumulatorSeconds / this.config.fixedStepSeconds);
      this.world.debug.droppedFrameSubsteps += droppedSubsteps;
      this.accumulatorSeconds -= droppedSubsteps * this.config.fixedStepSeconds;
    }

    this.world.debug.lastFrameSubsteps = stepsExecuted;
    return stepsExecuted;
  }

  public resetRun(seed = this.seed): void {
    this.seed = seed >>> 0;
    this.accumulatorSeconds = 0;
    resetWorld(this.world, this.seed, RunState.StartingRun);
  }

  public setRunState(nextState: RunState): void {
    applyRunState(this.world, nextState, "api");
  }

  public getRenderSnapshot(): RenderSnapshot {
    return extractRenderSnapshot(this.world);
  }

  public getFixedStepSeconds(): number {
    return this.config.fixedStepSeconds;
  }

  public getDebugSnapshot(): DebugSnapshot {
    const counters = {
      activeEnemies: this.world.stores.enemies.activeCount,
      activeProjectiles: this.world.stores.projectiles.activeCount,
      activePickups: this.world.stores.pickups.activeCount,
      damageRequestsProcessed: this.world.commands.damage.count,
      spawnCommandsProcessed:
        this.world.commands.enemySpawn.count +
        this.world.commands.projectileSpawn.count +
        this.world.commands.pickupSpawn.count,
      ticksStepped: this.world.debug.tick,
      elapsedSeconds: this.world.time.elapsedSeconds,
      lastFrameSeconds: this.world.debug.lastFrameSubsteps * this.config.fixedStepSeconds,
    };

    return {
      tick: this.world.debug.tick,
      seed: this.world.seed,
      gameplayTicks: this.world.debug.gameplayTicks,
      droppedFrameSubsteps: this.world.debug.droppedFrameSubsteps,
      lastFrameSubsteps: this.world.debug.lastFrameSubsteps,
      estimatedStepSeconds: this.world.debug.estimatedStepSeconds,
      runState: this.world.runState.current,
      lastRunStateChangeReason: this.world.debug.lastRunStateChangeReason,
      counters,
      activeEnemyCount: this.world.stores.enemies.activeCount,
      activeProjectileCount: this.world.stores.projectiles.activeCount,
      activePickupCount: this.world.stores.pickups.activeCount,
      queueSizes: {
        enemySpawn: this.world.commands.enemySpawn.count,
        projectileSpawn: this.world.commands.projectileSpawn.count,
        pickupSpawn: this.world.commands.pickupSpawn.count,
        damage: this.world.commands.damage.count,
        xpGrant: this.world.commands.xpGrant.count,
        despawn: this.world.commands.despawn.count,
        stateChange: this.world.commands.stateChange.count,
      },
      systems: Object.fromEntries(
        Object.entries(this.world.debug.systemCounters).map(([name, counter]) => [
          name,
          {
            executedTicks: counter.executedTicks,
            skippedTicks: counter.skippedTicks,
          },
        ]),
      ) as DebugSnapshot["systems"],
    };
  }

  private executeTick(inputFrame: Readonly<SimInput>): void {
    this.world.time.tick += 1;
    this.world.time.elapsedSeconds += this.config.fixedStepSeconds;
    this.world.debug.tick = this.world.time.tick;

    const context = createFrameContext(this.world, this.config, inputFrame);

    for (const system of this.pipeline) {
      const counter = this.world.debug.systemCounters[system.name];
      if (system.phase === "gameplay" && !isSimulationAdvancingState(this.world.runState.current)) {
        counter.skippedTicks += 1;
        continue;
      }

      counter.executedTicks += 1;
      system.execute(context);
    }

    if (isSimulationAdvancingState(this.world.runState.current)) {
      this.world.debug.gameplayTicks += 1;
    }

    this.world.debug.estimatedStepSeconds = this.world.debug.gameplayTicks * this.config.fixedStepSeconds;
  }
}

export function createSim(config: Partial<SimConfig> = {}, content: SimContent = {}, seed = 1): Sim {
  return new Sim(config, content, seed);
}
