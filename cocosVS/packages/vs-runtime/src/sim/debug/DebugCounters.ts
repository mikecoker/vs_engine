export interface DebugCounterValues {
  activeEnemies: number;
  activeProjectiles: number;
  activePickups: number;
  damageRequestsProcessed: number;
  spawnCommandsProcessed: number;
  ticksStepped: number;
  elapsedSeconds: number;
  lastFrameSeconds: number;
}

const ZERO_COUNTERS: DebugCounterValues = {
  activeEnemies: 0,
  activeProjectiles: 0,
  activePickups: 0,
  damageRequestsProcessed: 0,
  spawnCommandsProcessed: 0,
  ticksStepped: 0,
  elapsedSeconds: 0,
  lastFrameSeconds: 0,
};

export class DebugCounters {
  activeEnemies = 0;
  activeProjectiles = 0;
  activePickups = 0;
  damageRequestsProcessed = 0;
  spawnCommandsProcessed = 0;
  ticksStepped = 0;
  elapsedSeconds = 0;
  lastFrameSeconds = 0;

  reset(): void {
    this.assign(ZERO_COUNTERS);
  }

  beginFrame(frameSeconds: number): void {
    this.lastFrameSeconds = frameSeconds;
  }

  recordTick(dt: number): void {
    this.ticksStepped += 1;
    this.elapsedSeconds += dt;
  }

  recordDamageRequests(count = 1): void {
    this.damageRequestsProcessed += count;
  }

  recordSpawnCommands(count = 1): void {
    this.spawnCommandsProcessed += count;
  }

  setActiveCounts(activeEnemies: number, activeProjectiles: number, activePickups: number): void {
    this.activeEnemies = activeEnemies;
    this.activeProjectiles = activeProjectiles;
    this.activePickups = activePickups;
  }

  snapshot(): DebugCounterValues {
    return {
      activeEnemies: this.activeEnemies,
      activeProjectiles: this.activeProjectiles,
      activePickups: this.activePickups,
      damageRequestsProcessed: this.damageRequestsProcessed,
      spawnCommandsProcessed: this.spawnCommandsProcessed,
      ticksStepped: this.ticksStepped,
      elapsedSeconds: this.elapsedSeconds,
      lastFrameSeconds: this.lastFrameSeconds,
    };
  }

  private assign(values: DebugCounterValues): void {
    this.activeEnemies = values.activeEnemies;
    this.activeProjectiles = values.activeProjectiles;
    this.activePickups = values.activePickups;
    this.damageRequestsProcessed = values.damageRequestsProcessed;
    this.spawnCommandsProcessed = values.spawnCommandsProcessed;
    this.ticksStepped = values.ticksStepped;
    this.elapsedSeconds = values.elapsedSeconds;
    this.lastFrameSeconds = values.lastFrameSeconds;
  }
}
