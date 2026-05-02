import type { DebugSnapshot } from "../debug/DebugSnapshot.ts";
import { extractRenderSnapshot } from "./RenderExtract.ts";
import type { FrameContext } from "./FrameContext.ts";
import type { RenderSnapshot } from "./RenderSnapshot.ts";
import { RunState, isSimulationAdvancingState } from "./RunState.ts";
import { mergeSimConfig, type SimConfig } from "./SimConfig.ts";
import { EMPTY_SIM_INPUT, type SimInput } from "./SimInput.ts";
import type { SimApi, SimContent } from "./SimApi.ts";
import { createWorldFactory } from "../world/WorldFactory.ts";
import type { World } from "../world/World.ts";
import { resetWorld } from "../world/WorldReset.ts";
import { ensureLevelUpChoices, getLevelUpPayload, selectUpgrade } from "../progression/ProgressionApi.ts";
import { applyRunState } from "./RunStateTransition.ts";
import { createSystemPipeline, type SimSystem } from "./systems/SystemRegistry.ts";

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

  public getLevelUpPayload() {
    return getLevelUpPayload(this.world);
  }

  public ensureLevelUpPayload() {
    return ensureLevelUpChoices(this.world);
  }

  public selectUpgrade(choiceIndex: number): boolean {
    return selectUpgrade(this.world, choiceIndex);
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
      playerInvulnerable: this.world.stores.player.debugInvulnerable,
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
