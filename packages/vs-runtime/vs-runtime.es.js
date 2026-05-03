// src/client/content/ClientContentCatalog.ts
var EMPTY_CATALOG = {
  enemies: [],
  projectiles: [],
  pickups: [],
  weapons: [],
  passives: []
};
function isContentRegistry(content) {
  const registry = content;
  return typeof content === "object" && content !== null && !!registry.enemyArchetypes && !!registry.projectiles && !!registry.pickups && Array.isArray(registry.enemyArchetypes.defs) && Array.isArray(registry.projectiles.defs) && Array.isArray(registry.pickups.defs);
}
function createClientContentCatalog(content) {
  if (!isContentRegistry(content)) {
    return EMPTY_CATALOG;
  }
  return {
    enemies: content.enemyArchetypes.defs.map((def) => ({
      spriteKey: def.spriteKey,
      displayName: def.displayName
    })),
    projectiles: content.projectiles.defs.map((def) => ({
      spriteKey: def.spriteKey,
      displayName: def.displayName
    })),
    pickups: content.pickups.defs.map((def) => ({
      spriteKey: def.spriteKey,
      displayName: def.displayName,
      grantKind: def.grantKind
    })),
    weapons: content.weapons.defs.map((def) => ({
      iconKey: def.iconKey,
      displayName: def.displayName,
      description: def.description,
      behavior: def.behavior,
      baseAreaRadius: def.baseAreaRadius,
      baseDurationSeconds: def.baseDurationSeconds
    })),
    passives: content.passiveUpgrades.defs.map((def) => ({
      iconKey: def.iconKey,
      displayName: def.displayName,
      description: def.description
    }))
  };
}

// src/client/render/RenderPool.ts
var RenderPool = class {
  constructor(createItem) {
    this.createItem = createItem;
  }
  items = [];
  syncCount(count) {
    while (this.items.length < count) {
      this.items.push(this.createItem());
    }
    for (let index = 0; index < this.items.length; index += 1) {
      this.items[index].visible = index < count;
    }
  }
  getItems() {
    return this.items;
  }
};

// src/client/render/EnemyRenderPool.ts
var EnemyRenderPool = class {
  pool = new RenderPool(() => ({
    key: "",
    visible: false,
    x: 0,
    y: 0,
    typeId: 0,
    spriteKey: "",
    displayName: "",
    visualScale: 1
  }));
  sync(activeCount) {
    this.pool.syncCount(activeCount);
  }
  getItems() {
    return this.pool.getItems();
  }
};

// src/client/render/PickupRenderPool.ts
var HEAL_PICKUP_TINT = { r: 255, g: 120, b: 210, a: 255 };
var MAGNET_PICKUP_TINT = { r: 120, g: 190, b: 255, a: 255 };
var PickupRenderPool = class {
  pool = new RenderPool(() => ({
    key: "",
    visible: false,
    x: 0,
    y: 0,
    typeId: 0,
    spriteKey: "",
    displayName: "",
    grantKind: "xp",
    visualScale: 1
  }));
  sync(activeCount) {
    this.pool.syncCount(activeCount);
  }
  getItems() {
    return this.pool.getItems();
  }
};

// src/client/render/PlayerPresenter.ts
function presentPlayer(snapshot) {
  return {
    key: "player",
    visible: snapshot.exists,
    spriteKey: "player_witch",
    x: snapshot.x,
    y: snapshot.y,
    hp: snapshot.hp,
    maxHp: snapshot.maxHp
  };
}

// src/client/render/ProjectileRenderPool.ts
var ProjectileRenderPool = class {
  pool = new RenderPool(() => ({
    key: "",
    visible: false,
    x: 0,
    y: 0,
    typeId: 0,
    spriteKey: "",
    displayName: ""
  }));
  sync(activeCount) {
    this.pool.syncCount(activeCount);
  }
  getItems() {
    return this.pool.getItems();
  }
};

// src/client/render/WeaponEffectPresenter.ts
var WEAPON_LEVEL_AREA_BONUS = 0.1;
var NOVA_VISIBLE_SECONDS = 0.2;
function levelAreaScale(level) {
  return 1 + Math.max(0, level - 1) * WEAPON_LEVEL_AREA_BONUS;
}
function presentWeaponEffects(snapshot, content) {
  const effects = [];
  const player = snapshot.player;
  if (!player.exists) {
    return effects;
  }
  for (let index = 0; index < snapshot.weapons.activeCount; index += 1) {
    const typeId = snapshot.weapons.typeIds[index] ?? -1;
    const visual = content.weapons[typeId];
    if (!visual || visual.behavior !== "aura" && visual.behavior !== "nova") {
      continue;
    }
    const level = snapshot.weapons.levels[index] ?? 1;
    const radius = (player.radius + (visual.baseAreaRadius ?? 0)) * levelAreaScale(level);
    if (visual.behavior === "aura") {
      effects.push({
        key: `weapon-effect:${index}:aura`,
        behavior: "aura",
        x: player.x,
        y: player.y,
        radius,
        alpha: 0.3,
        visible: true
      });
      continue;
    }
    const lastFireAt = snapshot.weapons.lastFireElapsedSeconds[index] ?? -1;
    const age = snapshot.elapsedSeconds - lastFireAt;
    if (lastFireAt < 0 || age < 0 || age > NOVA_VISIBLE_SECONDS) {
      continue;
    }
    const normalizedAge = age / NOVA_VISIBLE_SECONDS;
    effects.push({
      key: `weapon-effect:${index}:nova`,
      behavior: "nova",
      x: player.x,
      y: player.y,
      radius: radius * (0.35 + normalizedAge * 0.65),
      alpha: Math.max(0, 1 - normalizedAge),
      visible: true
    });
  }
  return effects;
}

// src/client/render/RenderPresenter.ts
function getEnemyVisualScale(spriteKey) {
  if (spriteKey === "enemy_boss_lich") {
    return 1.8;
  }
  if (spriteKey === "enemy_miniboss_executioner") {
    return 1.45;
  }
  return 1;
}
function getPickupVisualScale(spriteKey) {
  if (spriteKey === "pickup_xp_large") {
    return 1.7;
  }
  if (spriteKey === "pickup_xp_medium") {
    return 1.35;
  }
  return 1;
}
var RenderPresenter = class {
  content;
  enemies = new EnemyRenderPool();
  projectiles = new ProjectileRenderPool();
  pickups = new PickupRenderPool();
  constructor(content = {}) {
    this.content = createClientContentCatalog(content);
  }
  present(snapshot) {
    this.enemies.sync(snapshot.enemies.activeCount);
    this.projectiles.sync(snapshot.projectiles.activeCount);
    this.pickups.sync(snapshot.pickups.activeCount);
    const enemyItems = this.enemies.getItems();
    for (let index = 0; index < snapshot.enemies.activeCount; index += 1) {
      const item = enemyItems[index];
      const visual = this.content.enemies[snapshot.enemies.typeIds[index] ?? -1];
      item.visible = true;
      item.key = `enemy:${index}`;
      item.typeId = snapshot.enemies.typeIds[index] ?? 0;
      item.spriteKey = visual?.spriteKey ?? "";
      item.displayName = visual?.displayName ?? "";
      item.visualScale = getEnemyVisualScale(item.spriteKey);
      item.x = snapshot.enemies.posX[index] ?? 0;
      item.y = snapshot.enemies.posY[index] ?? 0;
    }
    const projectileItems = this.projectiles.getItems();
    for (let index = 0; index < snapshot.projectiles.activeCount; index += 1) {
      const item = projectileItems[index];
      const visual = this.content.projectiles[snapshot.projectiles.typeIds[index] ?? -1];
      item.visible = true;
      item.key = `projectile:${index}`;
      item.typeId = snapshot.projectiles.typeIds[index] ?? 0;
      item.spriteKey = visual?.spriteKey ?? "";
      item.displayName = visual?.displayName ?? "";
      item.x = snapshot.projectiles.posX[index] ?? 0;
      item.y = snapshot.projectiles.posY[index] ?? 0;
    }
    const pickupItems = this.pickups.getItems();
    for (let index = 0; index < snapshot.pickups.activeCount; index += 1) {
      const item = pickupItems[index];
      const visual = this.content.pickups[snapshot.pickups.typeIds[index] ?? -1];
      item.visible = true;
      item.key = `pickup:${index}`;
      item.typeId = snapshot.pickups.typeIds[index] ?? 0;
      item.spriteKey = visual?.spriteKey ?? "";
      item.displayName = visual?.displayName ?? "";
      item.grantKind = visual?.grantKind ?? "xp";
      item.visualScale = getPickupVisualScale(item.spriteKey);
      item.tintColor = item.grantKind === "heal" ? HEAL_PICKUP_TINT : item.grantKind === "magnet" ? MAGNET_PICKUP_TINT : void 0;
      item.x = snapshot.pickups.posX[index] ?? 0;
      item.y = snapshot.pickups.posY[index] ?? 0;
    }
    return {
      elapsedSeconds: snapshot.elapsedSeconds,
      player: presentPlayer(snapshot.player),
      enemies: enemyItems,
      projectiles: projectileItems,
      pickups: pickupItems,
      weaponEffects: presentWeaponEffects(snapshot, this.content)
    };
  }
};

// src/client/ui/HudPresenter.ts
function presentHud(player, progression, elapsedSeconds) {
  return {
    hp: player.hp,
    maxHp: player.maxHp,
    level: progression.level,
    xp: progression.xp,
    xpToNext: progression.xpToNext,
    elapsedSeconds
  };
}

// src/client/ui/LevelUpPresenter.ts
function presentLevelUp(payload) {
  if (!payload) {
    return {
      visible: false,
      level: 0,
      xp: 0,
      xpToNext: 0,
      queuedLevelUps: 0,
      choices: []
    };
  }
  return {
    visible: true,
    level: payload.level,
    xp: payload.xp,
    xpToNext: payload.xpToNext,
    queuedLevelUps: payload.queuedLevelUps,
    choices: payload.choices
  };
}

// src/client/ui/RunStatePresenter.ts
function presentRunState(runState) {
  return {
    runState,
    showPauseOverlay: runState === "paused",
    showLevelUpOverlay: runState === "levelup_choice",
    showGameOverOverlay: runState === "game_over"
  };
}

// src/client/scene/CameraPresenter.ts
function presentCamera(player, zoom = 1) {
  return {
    centerX: player.x,
    centerY: player.y,
    zoom
  };
}

// src/client/ui/DebugPresenter.ts
function presentDebug(snapshot) {
  return {
    tick: snapshot.tick,
    gameplayTicks: snapshot.gameplayTicks,
    activeEnemyCount: snapshot.activeEnemyCount,
    activeProjectileCount: snapshot.activeProjectileCount,
    activePickupCount: snapshot.activePickupCount,
    playerInvulnerable: snapshot.playerInvulnerable,
    droppedFrameSubsteps: snapshot.droppedFrameSubsteps,
    lastRunStateChangeReason: snapshot.lastRunStateChangeReason
  };
}

// src/client/input/CocosInputAdapter.ts
function clampAxis(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value ?? 0));
}
function normalizeMovementAxes(moveX, moveY) {
  const clampedX = clampAxis(moveX);
  const clampedY = clampAxis(moveY);
  const magnitude = Math.hypot(clampedX, clampedY);
  if (magnitude <= 1) {
    return {
      moveX: clampedX,
      moveY: clampedY
    };
  }
  return {
    moveX: clampedX / magnitude,
    moveY: clampedY / magnitude
  };
}
function adaptCocosInput(source) {
  const movement = normalizeMovementAxes(source.moveX, source.moveY);
  return {
    moveX: movement.moveX,
    moveY: movement.moveY,
    pausePressed: source.pausePressed ?? false,
    confirmPressed: source.confirmPressed ?? false,
    cancelPressed: source.cancelPressed ?? false,
    debugGrantXpPressed: source.debugGrantXpPressed ?? false,
    debugSpawnWavePressed: source.debugSpawnWavePressed ?? false,
    debugToggleInvulnerablePressed: source.debugToggleInvulnerablePressed ?? false
  };
}

// src/client/app/ClientSession.ts
var ClientSession = class {
  constructor(sim, content = {}) {
    this.sim = sim;
    this.renderPresenter = new RenderPresenter(content);
  }
  renderPresenter;
  dispatch(action) {
    switch (action.type) {
      case "step":
        this.sim.step(action.frameSeconds, adaptCocosInput(action.input));
        return this.capture();
      case "capture":
        return this.capture();
      case "reset_run":
        this.sim.resetRun(action.seed);
        return this.capture();
      case "select_upgrade":
        this.sim.selectUpgrade(action.choiceIndex);
        return this.capture();
      default: {
        const exhaustive = action;
        throw new Error(`Unhandled client action: ${String(exhaustive)}`);
      }
    }
  }
  step(frameSeconds, input) {
    return this.dispatch({
      type: "step",
      frameSeconds,
      input
    });
  }
  capture() {
    const snapshot = this.sim.getRenderSnapshot();
    const levelUpPayload = this.sim.getLevelUpPayload();
    const debugSnapshot = this.sim.getDebugSnapshot();
    return {
      render: this.renderPresenter.present(snapshot),
      hud: presentHud(snapshot.player, snapshot.progression, snapshot.elapsedSeconds),
      runState: presentRunState(snapshot.runState),
      levelUp: presentLevelUp(levelUpPayload),
      camera: presentCamera(snapshot.player),
      debug: presentDebug(debugSnapshot)
    };
  }
  getSim() {
    return this.sim;
  }
};

// src/sim/enemies/EnemyStore.ts
var ACTIVE_SLOT_EMPTY = -1;
function createUint32Range(capacity) {
  const values = new Uint32Array(capacity);
  for (let index = 0; index < capacity; index += 1) {
    values[index] = index;
  }
  return values;
}
function createInt32Filled(capacity, value) {
  const values = new Int32Array(capacity);
  values.fill(value);
  return values;
}
function resetEnemyStore(store) {
  store.activeCount = 0;
  store.activeMask.fill(0);
  store.generation.fill(0);
  store.typeIds.fill(0);
  store.posX.fill(0);
  store.posY.fill(0);
  store.velX.fill(0);
  store.velY.fill(0);
  store.radius.fill(0);
  store.hp.fill(0);
  store.maxHp.fill(0);
  store.moveSpeed.fill(0);
  store.contactDamage.fill(0);
  store.xpValue.fill(0);
  store.flags.fill(0);
  store.activeSlots.fill(0);
  store.activeSlotIndex.fill(ACTIVE_SLOT_EMPTY);
  store.freeList = createUint32Range(store.capacity);
  store.freeCount = store.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds.fill(0);
  store.renderPosX.fill(0);
  store.renderPosY.fill(0);
}
function resizeUint8(source, nextCapacity) {
  const next = new Uint8Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeUint16(source, nextCapacity) {
  const next = new Uint16Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeUint32(source, nextCapacity) {
  const next = new Uint32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeInt32(source, nextCapacity, fillValue) {
  const next = new Int32Array(nextCapacity);
  next.fill(fillValue);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeFloat32(source, nextCapacity) {
  const next = new Float32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function growEnemyStore(store, nextCapacity) {
  if (nextCapacity <= store.capacity) {
    return;
  }
  const previousCapacity = store.capacity;
  store.capacity = nextCapacity;
  store.activeMask = resizeUint8(store.activeMask, nextCapacity);
  store.generation = resizeUint16(store.generation, nextCapacity);
  store.typeIds = resizeUint16(store.typeIds, nextCapacity);
  store.posX = resizeFloat32(store.posX, nextCapacity);
  store.posY = resizeFloat32(store.posY, nextCapacity);
  store.velX = resizeFloat32(store.velX, nextCapacity);
  store.velY = resizeFloat32(store.velY, nextCapacity);
  store.radius = resizeFloat32(store.radius, nextCapacity);
  store.hp = resizeFloat32(store.hp, nextCapacity);
  store.maxHp = resizeFloat32(store.maxHp, nextCapacity);
  store.moveSpeed = resizeFloat32(store.moveSpeed, nextCapacity);
  store.contactDamage = resizeFloat32(store.contactDamage, nextCapacity);
  store.xpValue = resizeUint16(store.xpValue, nextCapacity);
  store.flags = resizeUint32(store.flags, nextCapacity);
  store.activeSlots = resizeUint32(store.activeSlots, nextCapacity);
  store.activeSlotIndex = resizeInt32(store.activeSlotIndex, nextCapacity, ACTIVE_SLOT_EMPTY);
  store.renderTypeIds = resizeUint16(store.renderTypeIds, nextCapacity);
  store.renderPosX = resizeFloat32(store.renderPosX, nextCapacity);
  store.renderPosY = resizeFloat32(store.renderPosY, nextCapacity);
  const nextFreeList = new Uint32Array(nextCapacity);
  nextFreeList.set(store.freeList.subarray(0, store.freeCount));
  for (let index = previousCapacity; index < nextCapacity; index += 1) {
    nextFreeList[store.freeCount] = index;
    store.freeCount += 1;
  }
  store.freeList = nextFreeList;
}
function allocateEnemySlot(store) {
  if (store.freeCount === 0) {
    store.grow(Math.max(1, store.capacity * 2));
  }
  store.freeCount -= 1;
  const slot = store.freeList[store.freeCount];
  store.activeMask[slot] = 1;
  if (store.generation[slot] === 0) {
    store.generation[slot] = 1;
  }
  store.activeSlotIndex[slot] = store.activeCount;
  store.activeSlots[store.activeCount] = slot;
  store.activeCount += 1;
  if (slot >= store.nextUnusedIndex) {
    store.nextUnusedIndex = slot + 1;
  }
  return slot;
}
function releaseEnemySlot(store, slot) {
  if (!store.isAlive(slot)) {
    return false;
  }
  const denseIndex = store.activeSlotIndex[slot];
  const lastDenseIndex = store.activeCount - 1;
  const movedSlot = store.activeSlots[lastDenseIndex];
  store.activeCount = lastDenseIndex;
  store.activeMask[slot] = 0;
  store.activeSlotIndex[slot] = ACTIVE_SLOT_EMPTY;
  if (denseIndex !== lastDenseIndex) {
    store.activeSlots[denseIndex] = movedSlot;
    store.activeSlotIndex[movedSlot] = denseIndex;
  }
  store.activeSlots[lastDenseIndex] = 0;
  store.typeIds[slot] = 0;
  store.posX[slot] = 0;
  store.posY[slot] = 0;
  store.velX[slot] = 0;
  store.velY[slot] = 0;
  store.radius[slot] = 0;
  store.hp[slot] = 0;
  store.maxHp[slot] = 0;
  store.moveSpeed[slot] = 0;
  store.contactDamage[slot] = 0;
  store.xpValue[slot] = 0;
  store.flags[slot] = 0;
  const nextGeneration = store.generation[slot] + 1 & 65535;
  store.generation[slot] = nextGeneration === 0 ? 1 : nextGeneration;
  store.freeList[store.freeCount] = slot;
  store.freeCount += 1;
  return true;
}
function createEnemyStoreFromPlaceholder(base) {
  const store = base;
  if (typeof store.allocate === "function") {
    return store;
  }
  store.velX = new Float32Array(base.capacity);
  store.velY = new Float32Array(base.capacity);
  store.radius = new Float32Array(base.capacity);
  store.hp = new Float32Array(base.capacity);
  store.maxHp = new Float32Array(base.capacity);
  store.moveSpeed = new Float32Array(base.capacity);
  store.contactDamage = new Float32Array(base.capacity);
  store.xpValue = new Uint16Array(base.capacity);
  store.flags = new Uint32Array(base.capacity);
  store.activeSlots = new Uint32Array(base.capacity);
  store.activeSlotIndex = createInt32Filled(base.capacity, ACTIVE_SLOT_EMPTY);
  store.freeList = createUint32Range(base.capacity);
  store.freeCount = base.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds = new Uint16Array(base.capacity);
  store.renderPosX = new Float32Array(base.capacity);
  store.renderPosY = new Float32Array(base.capacity);
  store.allocate = () => allocateEnemySlot(store);
  store.release = (slot) => releaseEnemySlot(store, slot);
  store.isAlive = (slot) => slot >= 0 && slot < store.capacity && store.activeMask[slot] === 1;
  store.validate = (slot, generation) => slot >= 0 && slot < store.capacity && store.activeMask[slot] === 1 && store.generation[slot] === generation;
  store.grow = (nextCapacity) => growEnemyStore(store, nextCapacity);
  store.reset = () => resetEnemyStore(store);
  resetEnemyStore(store);
  return store;
}
function ensureEnemyStore(world) {
  return createEnemyStoreFromPlaceholder(world.stores.enemies);
}
function syncEnemyRenderViews(store) {
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    store.renderTypeIds[denseIndex] = store.typeIds[slot];
    store.renderPosX[denseIndex] = store.posX[slot];
    store.renderPosY[denseIndex] = store.posY[slot];
  }
}

// src/sim/pickups/PickupStore.ts
var ACTIVE_SLOT_EMPTY2 = -1;
function createFreeList(capacity) {
  const values = new Uint32Array(capacity);
  for (let index = 0; index < capacity; index += 1) {
    values[index] = capacity - 1 - index;
  }
  return values;
}
function createInt32Filled2(capacity, value) {
  const values = new Int32Array(capacity);
  values.fill(value);
  return values;
}
function resizeUint82(source, nextCapacity) {
  const next = new Uint8Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeUint162(source, nextCapacity) {
  const next = new Uint16Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeFloat322(source, nextCapacity) {
  const next = new Float32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeUint322(source, nextCapacity) {
  const next = new Uint32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeInt322(source, nextCapacity, fillValue) {
  const next = new Int32Array(nextCapacity);
  next.fill(fillValue);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resetPickupStore(store) {
  store.activeCount = 0;
  store.activeMask.fill(0);
  store.generation.fill(0);
  store.typeIds.fill(0);
  store.posX.fill(0);
  store.posY.fill(0);
  store.velX.fill(0);
  store.velY.fill(0);
  store.radius.fill(0);
  store.value.fill(0);
  store.magnetized.fill(0);
  store.magnetTimeRemaining.fill(0);
  store.magnetSpeed.fill(0);
  store.activeSlots.fill(0);
  store.activeSlotIndex.fill(ACTIVE_SLOT_EMPTY2);
  store.freeList = createFreeList(store.capacity);
  store.freeCount = store.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds.fill(0);
  store.renderPosX.fill(0);
  store.renderPosY.fill(0);
}
function growPickupStore(store, nextCapacity) {
  if (nextCapacity <= store.capacity) {
    return;
  }
  const previousCapacity = store.capacity;
  store.capacity = nextCapacity;
  store.activeMask = resizeUint82(store.activeMask, nextCapacity);
  store.generation = resizeUint162(store.generation, nextCapacity);
  store.typeIds = resizeUint162(store.typeIds, nextCapacity);
  store.posX = resizeFloat322(store.posX, nextCapacity);
  store.posY = resizeFloat322(store.posY, nextCapacity);
  store.velX = resizeFloat322(store.velX, nextCapacity);
  store.velY = resizeFloat322(store.velY, nextCapacity);
  store.radius = resizeFloat322(store.radius, nextCapacity);
  store.value = resizeUint162(store.value, nextCapacity);
  store.magnetized = resizeUint82(store.magnetized, nextCapacity);
  store.magnetTimeRemaining = resizeFloat322(store.magnetTimeRemaining, nextCapacity);
  store.magnetSpeed = resizeFloat322(store.magnetSpeed, nextCapacity);
  store.activeSlots = resizeUint322(store.activeSlots, nextCapacity);
  store.activeSlotIndex = resizeInt322(store.activeSlotIndex, nextCapacity, ACTIVE_SLOT_EMPTY2);
  store.renderTypeIds = resizeUint162(store.renderTypeIds, nextCapacity);
  store.renderPosX = resizeFloat322(store.renderPosX, nextCapacity);
  store.renderPosY = resizeFloat322(store.renderPosY, nextCapacity);
  const nextFreeList = new Uint32Array(nextCapacity);
  nextFreeList.set(store.freeList.subarray(0, store.freeCount));
  for (let index = nextCapacity - 1; index >= previousCapacity; index -= 1) {
    nextFreeList[store.freeCount] = index;
    store.freeCount += 1;
  }
  store.freeList = nextFreeList;
}
function clearPickupSlot(store, slot) {
  store.activeMask[slot] = 0;
  store.typeIds[slot] = 0;
  store.posX[slot] = 0;
  store.posY[slot] = 0;
  store.velX[slot] = 0;
  store.velY[slot] = 0;
  store.radius[slot] = 0;
  store.value[slot] = 0;
  store.magnetized[slot] = 0;
  store.magnetTimeRemaining[slot] = 0;
  store.magnetSpeed[slot] = 0;
  const nextGeneration = store.generation[slot] + 1 & 65535;
  store.generation[slot] = nextGeneration === 0 ? 1 : nextGeneration;
}
function allocatePickupSlot(store) {
  if (store.freeCount === 0) {
    store.grow(Math.max(1, store.capacity * 2));
  }
  store.freeCount -= 1;
  const slot = store.freeList[store.freeCount];
  store.activeMask[slot] = 1;
  if (store.generation[slot] === 0) {
    store.generation[slot] = 1;
  }
  store.activeSlotIndex[slot] = store.activeCount;
  store.activeSlots[store.activeCount] = slot;
  store.activeCount += 1;
  if (slot >= store.nextUnusedIndex) {
    store.nextUnusedIndex = slot + 1;
  }
  return slot;
}
function releasePickupSlot(store, slot) {
  if (!store.isAlive(slot)) {
    return false;
  }
  const denseIndex = store.activeSlotIndex[slot];
  const lastDenseIndex = store.activeCount - 1;
  const movedSlot = store.activeSlots[lastDenseIndex];
  store.activeCount = lastDenseIndex;
  store.activeSlotIndex[slot] = ACTIVE_SLOT_EMPTY2;
  if (denseIndex !== lastDenseIndex) {
    store.activeSlots[denseIndex] = movedSlot;
    store.activeSlotIndex[movedSlot] = denseIndex;
  }
  store.activeSlots[lastDenseIndex] = 0;
  clearPickupSlot(store, slot);
  store.freeList[store.freeCount] = slot;
  store.freeCount += 1;
  return true;
}
function isContentRegistry2(content) {
  const registry = content;
  return typeof content === "object" && content !== null && !!registry.pickups && Array.isArray(registry.pickups.defs);
}
function getPickupDefByIndex(content, pickupTypeId) {
  if (!isContentRegistry2(content) || pickupTypeId < 0) {
    return null;
  }
  return content.pickups.defs[pickupTypeId] ?? null;
}
function createPickupStoreFromPlaceholder(base) {
  const store = base;
  if (typeof store.allocate === "function") {
    return store;
  }
  store.velX = new Float32Array(base.capacity);
  store.velY = new Float32Array(base.capacity);
  store.radius = new Float32Array(base.capacity);
  store.value = new Uint16Array(base.capacity);
  store.magnetized = new Uint8Array(base.capacity);
  store.magnetTimeRemaining = new Float32Array(base.capacity);
  store.magnetSpeed = new Float32Array(base.capacity);
  store.activeSlots = new Uint32Array(base.capacity);
  store.activeSlotIndex = createInt32Filled2(base.capacity, ACTIVE_SLOT_EMPTY2);
  store.freeList = createFreeList(base.capacity);
  store.freeCount = base.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds = new Uint16Array(base.capacity);
  store.renderPosX = new Float32Array(base.capacity);
  store.renderPosY = new Float32Array(base.capacity);
  store.allocate = () => allocatePickupSlot(store);
  store.release = (slot) => releasePickupSlot(store, slot);
  store.isAlive = (slot) => slot >= 0 && slot < store.capacity && store.activeMask[slot] === 1;
  store.validate = (slot, generation) => slot >= 0 && slot < store.capacity && store.activeMask[slot] === 1 && store.generation[slot] === generation;
  store.grow = (nextCapacity) => growPickupStore(store, nextCapacity);
  store.reset = () => resetPickupStore(store);
  resetPickupStore(store);
  return store;
}
function ensurePickupStore(world) {
  return createPickupStoreFromPlaceholder(world.stores.pickups);
}
function syncPickupRenderViews(store) {
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    store.renderTypeIds[denseIndex] = store.typeIds[slot];
    store.renderPosX[denseIndex] = store.posX[slot];
    store.renderPosY[denseIndex] = store.posY[slot];
  }
}

// src/sim/projectiles/ProjectileStore.ts
var ACTIVE_SLOT_EMPTY3 = -1;
function createFreeList2(capacity) {
  const values = new Uint32Array(capacity);
  for (let index = 0; index < capacity; index += 1) {
    values[index] = capacity - 1 - index;
  }
  return values;
}
function createInt32Filled3(capacity, value) {
  const values = new Int32Array(capacity);
  values.fill(value);
  return values;
}
function resizeUint83(source, nextCapacity) {
  const next = new Uint8Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeUint163(source, nextCapacity) {
  const next = new Uint16Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeInt16(source, nextCapacity) {
  const next = new Int16Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeUint323(source, nextCapacity) {
  const next = new Uint32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeInt323(source, nextCapacity, fillValue) {
  const next = new Int32Array(nextCapacity);
  next.fill(fillValue);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function resizeFloat323(source, nextCapacity) {
  const next = new Float32Array(nextCapacity);
  next.set(source.subarray(0, Math.min(source.length, nextCapacity)));
  return next;
}
function clearProjectileSlot(store, slot) {
  store.activeMask[slot] = 0;
  store.typeIds[slot] = 0;
  store.posX[slot] = 0;
  store.posY[slot] = 0;
  store.ownerTeam[slot] = 0;
  store.velX[slot] = 0;
  store.velY[slot] = 0;
  store.radius[slot] = 0;
  store.damage[slot] = 0;
  store.remainingLife[slot] = 0;
  store.remainingPierce[slot] = 0;
  store.flags[slot] = 0;
  const nextGeneration = store.generation[slot] + 1 & 65535;
  store.generation[slot] = nextGeneration === 0 ? 1 : nextGeneration;
}
function resetProjectileStore(store) {
  store.activeCount = 0;
  store.activeMask.fill(0);
  store.generation.fill(0);
  store.typeIds.fill(0);
  store.posX.fill(0);
  store.posY.fill(0);
  store.ownerTeam.fill(0);
  store.velX.fill(0);
  store.velY.fill(0);
  store.radius.fill(0);
  store.damage.fill(0);
  store.remainingLife.fill(0);
  store.remainingPierce.fill(0);
  store.flags.fill(0);
  store.activeSlots.fill(0);
  store.activeSlotIndex.fill(ACTIVE_SLOT_EMPTY3);
  store.freeList = createFreeList2(store.capacity);
  store.freeCount = store.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds.fill(0);
  store.renderPosX.fill(0);
  store.renderPosY.fill(0);
}
function growProjectileStore(store, nextCapacity) {
  if (nextCapacity <= store.capacity) {
    return;
  }
  const previousCapacity = store.capacity;
  store.capacity = nextCapacity;
  store.activeMask = resizeUint83(store.activeMask, nextCapacity);
  store.generation = resizeUint163(store.generation, nextCapacity);
  store.typeIds = resizeUint163(store.typeIds, nextCapacity);
  store.posX = resizeFloat323(store.posX, nextCapacity);
  store.posY = resizeFloat323(store.posY, nextCapacity);
  store.ownerTeam = resizeUint83(store.ownerTeam, nextCapacity);
  store.velX = resizeFloat323(store.velX, nextCapacity);
  store.velY = resizeFloat323(store.velY, nextCapacity);
  store.radius = resizeFloat323(store.radius, nextCapacity);
  store.damage = resizeFloat323(store.damage, nextCapacity);
  store.remainingLife = resizeFloat323(store.remainingLife, nextCapacity);
  store.remainingPierce = resizeInt16(store.remainingPierce, nextCapacity);
  store.flags = resizeUint323(store.flags, nextCapacity);
  store.activeSlots = resizeUint323(store.activeSlots, nextCapacity);
  store.activeSlotIndex = resizeInt323(store.activeSlotIndex, nextCapacity, ACTIVE_SLOT_EMPTY3);
  store.renderTypeIds = resizeUint163(store.renderTypeIds, nextCapacity);
  store.renderPosX = resizeFloat323(store.renderPosX, nextCapacity);
  store.renderPosY = resizeFloat323(store.renderPosY, nextCapacity);
  const nextFreeList = new Uint32Array(nextCapacity);
  nextFreeList.set(store.freeList.subarray(0, store.freeCount));
  for (let index = nextCapacity - 1; index >= previousCapacity; index -= 1) {
    nextFreeList[store.freeCount] = index;
    store.freeCount += 1;
  }
  store.freeList = nextFreeList;
}
function allocateProjectileSlot(store) {
  if (store.freeCount === 0) {
    store.grow(Math.max(1, store.capacity * 2));
  }
  store.freeCount -= 1;
  const slot = store.freeList[store.freeCount];
  store.activeMask[slot] = 1;
  if (store.generation[slot] === 0) {
    store.generation[slot] = 1;
  }
  store.activeSlotIndex[slot] = store.activeCount;
  store.activeSlots[store.activeCount] = slot;
  store.activeCount += 1;
  if (slot >= store.nextUnusedIndex) {
    store.nextUnusedIndex = slot + 1;
  }
  return slot;
}
function releaseProjectileSlot(store, slot) {
  if (!store.isAlive(slot)) {
    return false;
  }
  const denseIndex = store.activeSlotIndex[slot];
  const lastDenseIndex = store.activeCount - 1;
  const movedSlot = store.activeSlots[lastDenseIndex];
  store.activeCount = lastDenseIndex;
  store.activeSlotIndex[slot] = ACTIVE_SLOT_EMPTY3;
  if (denseIndex !== lastDenseIndex) {
    store.activeSlots[denseIndex] = movedSlot;
    store.activeSlotIndex[movedSlot] = denseIndex;
  }
  store.activeSlots[lastDenseIndex] = 0;
  clearProjectileSlot(store, slot);
  store.freeList[store.freeCount] = slot;
  store.freeCount += 1;
  return true;
}
function createProjectileStoreFromPlaceholder(base) {
  const store = base;
  if (typeof store.allocate === "function") {
    return store;
  }
  store.ownerTeam = new Uint8Array(base.capacity);
  store.velX = new Float32Array(base.capacity);
  store.velY = new Float32Array(base.capacity);
  store.radius = new Float32Array(base.capacity);
  store.damage = new Float32Array(base.capacity);
  store.remainingLife = new Float32Array(base.capacity);
  store.remainingPierce = new Int16Array(base.capacity);
  store.flags = new Uint32Array(base.capacity);
  store.activeSlots = new Uint32Array(base.capacity);
  store.activeSlotIndex = createInt32Filled3(base.capacity, ACTIVE_SLOT_EMPTY3);
  store.freeList = createFreeList2(base.capacity);
  store.freeCount = base.capacity;
  store.nextUnusedIndex = 0;
  store.renderTypeIds = new Uint16Array(base.capacity);
  store.renderPosX = new Float32Array(base.capacity);
  store.renderPosY = new Float32Array(base.capacity);
  store.allocate = () => allocateProjectileSlot(store);
  store.release = (slot) => releaseProjectileSlot(store, slot);
  store.isAlive = (slot) => slot >= 0 && slot < store.capacity && store.activeMask[slot] === 1;
  store.validate = (slot, generation) => slot >= 0 && slot < store.capacity && store.activeMask[slot] === 1 && store.generation[slot] === generation;
  store.grow = (nextCapacity) => growProjectileStore(store, nextCapacity);
  store.reset = () => resetProjectileStore(store);
  resetProjectileStore(store);
  return store;
}
function ensureProjectileStore(world) {
  return createProjectileStoreFromPlaceholder(world.stores.projectiles);
}
function syncProjectileRenderViews(store) {
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    store.renderTypeIds[denseIndex] = store.typeIds[slot];
    store.renderPosX[denseIndex] = store.posX[slot];
    store.renderPosY[denseIndex] = store.posY[slot];
  }
}

// src/sim/combat/WeaponRuntimeStore.ts
function isContentRegistry3(value) {
  const registry = value;
  return typeof value === "object" && value !== null && !!registry.playerCharacters && !!registry.weapons && Array.isArray(registry.playerCharacters.defs) && Array.isArray(registry.weapons.defs);
}
function createWeaponRuntimeStore(initialCapacity = 4) {
  return {
    capacity: initialCapacity,
    activeCount: 0,
    ownerCharacterId: null,
    weaponTypeIds: new Uint16Array(initialCapacity),
    weaponLevels: new Uint8Array(initialCapacity),
    cooldownRemaining: new Float32Array(initialCapacity),
    lastFireElapsedSeconds: new Float32Array(initialCapacity),
    renderTypeIds: new Uint16Array(initialCapacity),
    renderLevels: new Uint8Array(initialCapacity),
    renderCooldownRemaining: new Float32Array(initialCapacity),
    renderLastFireElapsedSeconds: new Float32Array(initialCapacity),
    reset() {
      this.activeCount = 0;
      this.ownerCharacterId = null;
      this.weaponTypeIds.fill(0);
      this.weaponLevels.fill(0);
      this.cooldownRemaining.fill(0);
      this.lastFireElapsedSeconds.fill(-1);
      this.renderTypeIds.fill(0);
      this.renderLevels.fill(0);
      this.renderCooldownRemaining.fill(0);
      this.renderLastFireElapsedSeconds.fill(-1);
    },
    ensureCapacity(nextCapacity) {
      if (nextCapacity <= this.capacity) {
        return;
      }
      const nextWeaponIds = new Uint16Array(nextCapacity);
      nextWeaponIds.set(this.weaponTypeIds.subarray(0, this.activeCount));
      this.weaponTypeIds = nextWeaponIds;
      const nextLevels = new Uint8Array(nextCapacity);
      nextLevels.set(this.weaponLevels.subarray(0, this.activeCount));
      this.weaponLevels = nextLevels;
      const nextCooldowns = new Float32Array(nextCapacity);
      nextCooldowns.set(this.cooldownRemaining.subarray(0, this.activeCount));
      this.cooldownRemaining = nextCooldowns;
      const nextLastFire = new Float32Array(nextCapacity);
      nextLastFire.fill(-1);
      nextLastFire.set(this.lastFireElapsedSeconds.subarray(0, this.activeCount));
      this.lastFireElapsedSeconds = nextLastFire;
      const nextRenderWeaponIds = new Uint16Array(nextCapacity);
      nextRenderWeaponIds.set(this.renderTypeIds.subarray(0, this.activeCount));
      this.renderTypeIds = nextRenderWeaponIds;
      const nextRenderLevels = new Uint8Array(nextCapacity);
      nextRenderLevels.set(this.renderLevels.subarray(0, this.activeCount));
      this.renderLevels = nextRenderLevels;
      const nextRenderCooldowns = new Float32Array(nextCapacity);
      nextRenderCooldowns.set(this.renderCooldownRemaining.subarray(0, this.activeCount));
      this.renderCooldownRemaining = nextRenderCooldowns;
      const nextRenderLastFire = new Float32Array(nextCapacity);
      nextRenderLastFire.fill(-1);
      nextRenderLastFire.set(this.renderLastFireElapsedSeconds.subarray(0, this.activeCount));
      this.renderLastFireElapsedSeconds = nextRenderLastFire;
      this.capacity = nextCapacity;
    }
  };
}
function loadWeaponIds(store, content, ownerCharacterId, weaponIds) {
  store.reset();
  store.ensureCapacity(Math.max(store.capacity, weaponIds.length));
  store.ownerCharacterId = ownerCharacterId;
  for (let index = 0; index < weaponIds.length; index += 1) {
    store.weaponTypeIds[index] = content.weapons.getIndex(weaponIds[index]);
    store.weaponLevels[index] = 1;
    store.cooldownRemaining[index] = 0;
    store.lastFireElapsedSeconds[index] = -1;
  }
  store.activeCount = weaponIds.length;
}
function ensureWeaponRuntimeStore(world) {
  if (!world.scratch.weaponRuntimeStore) {
    world.scratch.weaponRuntimeStore = createWeaponRuntimeStore();
  }
  const store = world.scratch.weaponRuntimeStore;
  const player = world.stores.player;
  if (!player.exists || !player.characterId || !isContentRegistry3(world.content)) {
    return store;
  }
  if (store.ownerCharacterId !== player.characterId || store.activeCount === 0) {
    const playerDef = world.content.playerCharacters.get(player.characterId);
    loadWeaponIds(store, world.content, player.characterId, playerDef.starterWeaponIds);
  }
  return store;
}
function syncWeaponRenderViews(store) {
  for (let index = 0; index < store.activeCount; index += 1) {
    store.renderTypeIds[index] = store.weaponTypeIds[index];
    store.renderLevels[index] = store.weaponLevels[index];
    store.renderCooldownRemaining[index] = store.cooldownRemaining[index];
    store.renderLastFireElapsedSeconds[index] = store.lastFireElapsedSeconds[index];
  }
}

// src/sim/core/RenderExtract.ts
function extractRenderSnapshot(world) {
  const enemies = ensureEnemyStore(world);
  const projectiles = ensureProjectileStore(world);
  const pickups = ensurePickupStore(world);
  const weapons = ensureWeaponRuntimeStore(world);
  syncEnemyRenderViews(enemies);
  syncProjectileRenderViews(projectiles);
  syncPickupRenderViews(pickups);
  syncWeaponRenderViews(weapons);
  return {
    runState: world.runState.current,
    elapsedSeconds: world.time.elapsedSeconds,
    player: {
      exists: world.stores.player.exists,
      x: world.stores.player.posX,
      y: world.stores.player.posY,
      radius: world.stores.player.radius,
      hp: world.stores.player.hp,
      maxHp: world.stores.player.maxHp
    },
    enemies: {
      activeCount: enemies.activeCount,
      typeIds: enemies.renderTypeIds,
      posX: enemies.renderPosX,
      posY: enemies.renderPosY
    },
    projectiles: {
      activeCount: projectiles.activeCount,
      typeIds: projectiles.renderTypeIds,
      posX: projectiles.renderPosX,
      posY: projectiles.renderPosY
    },
    pickups: {
      activeCount: pickups.activeCount,
      typeIds: pickups.renderTypeIds,
      posX: pickups.renderPosX,
      posY: pickups.renderPosY
    },
    progression: {
      level: world.stores.progression.level,
      xp: world.stores.progression.xp,
      xpToNext: world.stores.progression.xpToNext,
      queuedLevelUps: world.stores.progression.queuedLevelUps
    },
    weapons: {
      activeCount: weapons.activeCount,
      typeIds: weapons.renderTypeIds,
      levels: weapons.renderLevels,
      cooldownRemaining: weapons.renderCooldownRemaining,
      lastFireElapsedSeconds: weapons.renderLastFireElapsedSeconds
    }
  };
}

// src/sim/core/RunState.ts
var RunState = {
  Boot: "boot",
  MainMenu: "main_menu",
  StartingRun: "starting_run",
  Running: "running",
  Paused: "paused",
  LevelUpChoice: "levelup_choice",
  GameOver: "game_over"
};
var RUN_STATE_TRANSITIONS = {
  [RunState.Boot]: [RunState.MainMenu, RunState.StartingRun],
  [RunState.MainMenu]: [RunState.StartingRun],
  [RunState.StartingRun]: [RunState.Running, RunState.Paused, RunState.GameOver],
  [RunState.Running]: [RunState.Paused, RunState.LevelUpChoice, RunState.GameOver],
  [RunState.Paused]: [RunState.Running, RunState.MainMenu, RunState.GameOver],
  [RunState.LevelUpChoice]: [RunState.Running, RunState.GameOver],
  [RunState.GameOver]: [RunState.MainMenu, RunState.StartingRun]
};
function canTransitionRunState(current, next) {
  return current === next || RUN_STATE_TRANSITIONS[current].includes(next);
}
function isSimulationAdvancingState(state) {
  return state === RunState.StartingRun || state === RunState.Running;
}

// src/sim/core/SimConfig.ts
var DEFAULT_SIM_BOUNDS = {
  player: {
    minX: -900,
    maxX: 900,
    minY: -900,
    maxY: 900
  },
  spawn: {
    minX: -1250,
    maxX: 1250,
    minY: -1250,
    maxY: 1250
  }
};
var DEFAULT_SIM_CONFIG = {
  fixedStepSeconds: 1 / 60,
  maxSubstepsPerFrame: 5,
  maxFrameSeconds: 0.25,
  initialRunState: RunState.MainMenu,
  bounds: DEFAULT_SIM_BOUNDS,
  capacities: {
    enemies: 512,
    projectiles: 1024,
    pickups: 512,
    commandBuffer: 256
  }
};
function mergeSimConfig(overrides = {}) {
  return {
    fixedStepSeconds: overrides.fixedStepSeconds ?? DEFAULT_SIM_CONFIG.fixedStepSeconds,
    maxSubstepsPerFrame: overrides.maxSubstepsPerFrame ?? DEFAULT_SIM_CONFIG.maxSubstepsPerFrame,
    maxFrameSeconds: overrides.maxFrameSeconds ?? DEFAULT_SIM_CONFIG.maxFrameSeconds,
    initialRunState: overrides.initialRunState ?? DEFAULT_SIM_CONFIG.initialRunState,
    bounds: {
      player: {
        minX: overrides.bounds?.player.minX ?? DEFAULT_SIM_BOUNDS.player.minX,
        maxX: overrides.bounds?.player.maxX ?? DEFAULT_SIM_BOUNDS.player.maxX,
        minY: overrides.bounds?.player.minY ?? DEFAULT_SIM_BOUNDS.player.minY,
        maxY: overrides.bounds?.player.maxY ?? DEFAULT_SIM_BOUNDS.player.maxY
      },
      spawn: {
        minX: overrides.bounds?.spawn.minX ?? DEFAULT_SIM_BOUNDS.spawn.minX,
        maxX: overrides.bounds?.spawn.maxX ?? DEFAULT_SIM_BOUNDS.spawn.maxX,
        minY: overrides.bounds?.spawn.minY ?? DEFAULT_SIM_BOUNDS.spawn.minY,
        maxY: overrides.bounds?.spawn.maxY ?? DEFAULT_SIM_BOUNDS.spawn.maxY
      }
    },
    capacities: {
      enemies: overrides.capacities?.enemies ?? DEFAULT_SIM_CONFIG.capacities.enemies,
      projectiles: overrides.capacities?.projectiles ?? DEFAULT_SIM_CONFIG.capacities.projectiles,
      pickups: overrides.capacities?.pickups ?? DEFAULT_SIM_CONFIG.capacities.pickups,
      commandBuffer: overrides.capacities?.commandBuffer ?? DEFAULT_SIM_CONFIG.capacities.commandBuffer
    }
  };
}

// src/sim/core/SimInput.ts
var EMPTY_SIM_INPUT = {
  moveX: 0,
  moveY: 0,
  pausePressed: false,
  confirmPressed: false,
  cancelPressed: false,
  debugGrantXpPressed: false,
  debugSpawnWavePressed: false,
  debugToggleInvulnerablePressed: false
};

// src/sim/core/commands/ReusableCommandBuffer.ts
var ReusableCommandBuffer = class {
  constructor(createRecord) {
    this.createRecord = createRecord;
  }
  records = [];
  count = 0;
  nextRecord() {
    const record = this.records[this.count] ?? this.createAndStoreRecord();
    this.count += 1;
    return record;
  }
  get(index) {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`Command index ${index} is out of bounds for count ${this.count}.`);
    }
    return this.records[index];
  }
  clear() {
    this.count = 0;
  }
  createAndStoreRecord() {
    const record = this.createRecord();
    this.records.push(record);
    return record;
  }
};

// src/sim/core/commands/DamageBuffer.ts
var DamageBuffer = class extends ReusableCommandBuffer {
  constructor() {
    super(() => ({
      targetKind: "enemy",
      targetId: -1,
      amount: 0,
      sourceKind: "unknown",
      sourceId: -1
    }));
  }
  enqueue(targetKind, targetId, amount, sourceKind, sourceId) {
    const command = this.nextRecord();
    command.targetKind = targetKind;
    command.targetId = targetId;
    command.amount = amount;
    command.sourceKind = sourceKind;
    command.sourceId = sourceId;
  }
};

// src/sim/core/commands/DespawnBuffer.ts
var DespawnBuffer = class extends ReusableCommandBuffer {
  constructor() {
    super(() => ({ entityKind: "enemy", entityId: -1 }));
  }
  enqueue(entityKind, entityId) {
    const command = this.nextRecord();
    command.entityKind = entityKind;
    command.entityId = entityId;
  }
};

// src/sim/core/commands/EnemySpawnBuffer.ts
var EnemySpawnBuffer = class extends ReusableCommandBuffer {
  constructor() {
    super(() => ({ archetypeId: 0, x: 0, y: 0 }));
  }
  enqueue(archetypeId, x, y) {
    const command = this.nextRecord();
    command.archetypeId = archetypeId;
    command.x = x;
    command.y = y;
  }
};

// src/sim/core/commands/PickupSpawnBuffer.ts
var PickupSpawnBuffer = class extends ReusableCommandBuffer {
  constructor() {
    super(() => ({ pickupTypeId: 0, x: 0, y: 0, radius: 0, value: 0 }));
  }
  enqueue(pickupTypeId, x, y, radius, value) {
    const command = this.nextRecord();
    command.pickupTypeId = pickupTypeId;
    command.x = x;
    command.y = y;
    command.radius = radius;
    command.value = value;
  }
};

// src/sim/core/commands/ProjectileSpawnBuffer.ts
var ProjectileSpawnBuffer = class extends ReusableCommandBuffer {
  constructor() {
    super(() => ({
      projectileTypeId: 0,
      ownerTeam: 0,
      x: 0,
      y: 0,
      velX: 0,
      velY: 0,
      radius: 0,
      damage: 0,
      remainingLife: 0,
      remainingPierce: 0,
      flags: 0
    }));
  }
  enqueue(commandInput) {
    this.enqueueValues(
      commandInput.projectileTypeId,
      commandInput.ownerTeam,
      commandInput.x,
      commandInput.y,
      commandInput.velX,
      commandInput.velY,
      commandInput.radius,
      commandInput.damage,
      commandInput.remainingLife,
      commandInput.remainingPierce,
      commandInput.flags
    );
  }
  enqueueValues(projectileTypeId, ownerTeam, x, y, velX, velY, radius, damage, remainingLife, remainingPierce, flags) {
    const command = this.nextRecord();
    command.projectileTypeId = projectileTypeId;
    command.ownerTeam = ownerTeam;
    command.x = x;
    command.y = y;
    command.velX = velX;
    command.velY = velY;
    command.radius = radius;
    command.damage = damage;
    command.remainingLife = remainingLife;
    command.remainingPierce = remainingPierce;
    command.flags = flags;
  }
};

// src/sim/core/commands/StateChangeBuffer.ts
var StateChangeBuffer = class extends ReusableCommandBuffer {
  constructor() {
    super(() => ({ nextState: RunState.Boot, reason: "" }));
  }
  enqueue(nextState, reason) {
    const command = this.nextRecord();
    command.nextState = nextState;
    command.reason = reason;
  }
};

// src/sim/core/commands/XpGrantBuffer.ts
var XpGrantBuffer = class extends ReusableCommandBuffer {
  constructor() {
    super(() => ({ amount: 0 }));
  }
  enqueue(amount) {
    this.nextRecord().amount = amount;
  }
};

// src/sim/debug/DebugSnapshot.ts
var SYSTEM_ORDER = [
  "RunStateSystem",
  "InputApplySystem",
  "SpawnDirectorSystem",
  "ApplySpawnCommandsSystem",
  "PlayerMovementSystem",
  "PreMovementSpatialGridBuildSystem",
  "EnemyMovementSystem",
  "WeaponFireSystem",
  "ApplyProjectileSpawnCommandsSystem",
  "ProjectileMovementSystem",
  "SpatialGridBuildSystem",
  "ContactDamageQuerySystem",
  "ProjectileHitQuerySystem",
  "DamageResolveSystem",
  "DeathAndDropSystem",
  "PickupMagnetSystem",
  "PickupCollectSystem",
  "ProgressionSystem",
  "CleanupSystem",
  "RenderExtractSystem"
];
function createDebugCounters() {
  return {
    tick: 0,
    gameplayTicks: 0,
    droppedFrameSubsteps: 0,
    lastFrameSubsteps: 0,
    estimatedStepSeconds: 0,
    lastRunStateChangeReason: "initial",
    systemCounters: SYSTEM_ORDER.reduce(
      (accumulator, systemName) => {
        accumulator[systemName] = { executedTicks: 0, skippedTicks: 0 };
        return accumulator;
      },
      {}
    )
  };
}

// src/sim/player/PlayerStatSnapshot.ts
var DEFAULT_PLAYER_STAT_SNAPSHOT = {
  maxHp: 100,
  moveSpeed: 160,
  armor: 0,
  might: 1,
  cooldownMultiplier: 1,
  durationMultiplier: 1,
  areaMultiplier: 1,
  projectileCount: 1,
  pickupRadius: 40,
  luck: 0,
  radius: 12
};

// src/sim/player/PlayerStats.ts
var STAT_KEYS = [
  "maxHp",
  "moveSpeed",
  "pickupRadius",
  "might",
  "cooldownMultiplier",
  "durationMultiplier",
  "areaMultiplier",
  "projectileCount",
  "armor",
  "luck"
];
var DEFAULT_PLAYER_BASE_STATS = {
  maxHp: DEFAULT_PLAYER_STAT_SNAPSHOT.maxHp,
  moveSpeed: DEFAULT_PLAYER_STAT_SNAPSHOT.moveSpeed,
  radius: DEFAULT_PLAYER_STAT_SNAPSHOT.radius,
  pickupRadius: DEFAULT_PLAYER_STAT_SNAPSHOT.pickupRadius,
  armor: DEFAULT_PLAYER_STAT_SNAPSHOT.armor,
  might: DEFAULT_PLAYER_STAT_SNAPSHOT.might,
  cooldownMultiplier: DEFAULT_PLAYER_STAT_SNAPSHOT.cooldownMultiplier,
  durationMultiplier: DEFAULT_PLAYER_STAT_SNAPSHOT.durationMultiplier,
  areaMultiplier: DEFAULT_PLAYER_STAT_SNAPSHOT.areaMultiplier,
  projectileCount: DEFAULT_PLAYER_STAT_SNAPSHOT.projectileCount,
  luck: DEFAULT_PLAYER_STAT_SNAPSHOT.luck
};
function createStatValueMap(seedValue) {
  return {
    maxHp: seedValue,
    moveSpeed: seedValue,
    pickupRadius: seedValue,
    might: seedValue,
    cooldownMultiplier: seedValue,
    durationMultiplier: seedValue,
    areaMultiplier: seedValue,
    projectileCount: seedValue,
    armor: seedValue,
    luck: seedValue
  };
}
function clonePlayerBaseStats(baseStats) {
  return {
    maxHp: baseStats.maxHp,
    moveSpeed: baseStats.moveSpeed,
    radius: baseStats.radius,
    pickupRadius: baseStats.pickupRadius,
    armor: baseStats.armor,
    might: baseStats.might,
    cooldownMultiplier: baseStats.cooldownMultiplier,
    durationMultiplier: baseStats.durationMultiplier,
    areaMultiplier: baseStats.areaMultiplier,
    projectileCount: baseStats.projectileCount,
    luck: baseStats.luck
  };
}
function createPlayerStatModifiers() {
  return {
    additive: createStatValueMap(0),
    multiplicative: createStatValueMap(1)
  };
}
function resetPlayerStatModifiers(modifiers) {
  for (const key of STAT_KEYS) {
    modifiers.additive[key] = 0;
    modifiers.multiplicative[key] = 1;
  }
}
function applyPlayerStatModifier(modifiers, modifier) {
  if (modifier.mode === "add") {
    modifiers.additive[modifier.stat] += modifier.value;
    return;
  }
  modifiers.multiplicative[modifier.stat] *= modifier.value;
}
function applyPlayerStatModifiers(modifiers, modifierDefs) {
  for (let index = 0; index < modifierDefs.length; index += 1) {
    applyPlayerStatModifier(modifiers, modifierDefs[index]);
  }
}
function clampMin(value, minimum) {
  return value < minimum ? minimum : value;
}
function buildModifiedStat(baseValue, addValue, multiplier, minimum) {
  return clampMin((baseValue + addValue) * multiplier, minimum);
}
function rebuildPlayerStatSnapshot(baseStats, modifiers) {
  return {
    maxHp: buildModifiedStat(baseStats.maxHp, modifiers.additive.maxHp, modifiers.multiplicative.maxHp, 1),
    moveSpeed: buildModifiedStat(
      baseStats.moveSpeed,
      modifiers.additive.moveSpeed,
      modifiers.multiplicative.moveSpeed,
      0
    ),
    armor: (baseStats.armor + modifiers.additive.armor) * modifiers.multiplicative.armor,
    might: buildModifiedStat(baseStats.might, modifiers.additive.might, modifiers.multiplicative.might, 0),
    cooldownMultiplier: buildModifiedStat(
      baseStats.cooldownMultiplier,
      modifiers.additive.cooldownMultiplier,
      modifiers.multiplicative.cooldownMultiplier,
      0.05
    ),
    durationMultiplier: buildModifiedStat(
      baseStats.durationMultiplier,
      modifiers.additive.durationMultiplier,
      modifiers.multiplicative.durationMultiplier,
      0
    ),
    areaMultiplier: buildModifiedStat(
      baseStats.areaMultiplier,
      modifiers.additive.areaMultiplier,
      modifiers.multiplicative.areaMultiplier,
      0
    ),
    projectileCount: Math.max(
      0,
      Math.round(
        (baseStats.projectileCount + modifiers.additive.projectileCount) * modifiers.multiplicative.projectileCount
      )
    ),
    pickupRadius: buildModifiedStat(
      baseStats.pickupRadius,
      modifiers.additive.pickupRadius,
      modifiers.multiplicative.pickupRadius,
      0
    ),
    luck: (baseStats.luck + modifiers.additive.luck) * modifiers.multiplicative.luck,
    radius: clampMin(baseStats.radius, 1)
  };
}

// src/sim/player/PlayerStore.ts
var DEFAULT_PLAYER_INVULNERABILITY_SECONDS = 0.5;
function createPlayerStore() {
  return {
    exists: false,
    isDead: false,
    characterId: null,
    posX: 0,
    posY: 0,
    velX: 0,
    velY: 0,
    facingX: 1,
    facingY: 0,
    radius: DEFAULT_PLAYER_STAT_SNAPSHOT.radius,
    hp: DEFAULT_PLAYER_STAT_SNAPSHOT.maxHp,
    maxHp: DEFAULT_PLAYER_STAT_SNAPSHOT.maxHp,
    debugInvulnerable: false,
    invulnRemaining: 0,
    invulnerabilityDurationSeconds: DEFAULT_PLAYER_INVULNERABILITY_SECONDS,
    pickupRadius: DEFAULT_PLAYER_STAT_SNAPSHOT.pickupRadius,
    baseStats: clonePlayerBaseStats(DEFAULT_PLAYER_BASE_STATS),
    statModifiers: createPlayerStatModifiers(),
    statSnapshot: { ...DEFAULT_PLAYER_STAT_SNAPSHOT }
  };
}

// src/sim/progression/LevelCurve.ts
function isContentRegistry4(content) {
  const registry = content;
  return typeof content === "object" && content !== null && !!registry.progressionCurves && Array.isArray(registry.progressionCurves.defs);
}
function resolveActiveProgressionCurve(content) {
  if (!isContentRegistry4(content)) {
    return null;
  }
  const waveDef = content.waves.defs[0];
  if (waveDef) {
    const curveIndex = content.progressionCurves.getIndex(waveDef.progressionCurveId);
    return {
      curve: content.progressionCurves.defs[curveIndex],
      curveIndex
    };
  }
  const curve = content.progressionCurves.defs[0];
  if (!curve) {
    return null;
  }
  return {
    curve,
    curveIndex: 0
  };
}
function getXpThresholdForLevel(curve, level) {
  const nextLevelIndex = Math.max(0, level - 1);
  if (!curve || curve.levelXpThresholds.length === 0) {
    return 5;
  }
  if (nextLevelIndex < curve.levelXpThresholds.length) {
    return Math.max(1, curve.levelXpThresholds[nextLevelIndex] ?? 1);
  }
  const lastIndex = curve.levelXpThresholds.length - 1;
  const lastThreshold = curve.levelXpThresholds[lastIndex] ?? 1;
  const previousThreshold = curve.levelXpThresholds[lastIndex - 1] ?? lastThreshold;
  const step = Math.max(1, lastThreshold - previousThreshold);
  return lastThreshold + step * (nextLevelIndex - lastIndex);
}

// src/sim/progression/ProgressionStore.ts
function createProgressionStore(passiveUpgradeCount = 0) {
  return {
    level: 1,
    xp: 0,
    xpToNext: 5,
    queuedLevelUps: 0,
    currentChoices: [],
    activeCurveIndex: -1,
    passiveUpgradeLevels: new Uint8Array(passiveUpgradeCount),
    initialized: false,
    lastResetTick: -1
  };
}
function resolvePassiveUpgradeCount(content) {
  const defs = content.passiveUpgrades;
  return defs && Array.isArray(defs.defs) ? defs.defs.length ?? 0 : 0;
}
function createPassiveLevelBuffer(world) {
  return new Uint8Array(resolvePassiveUpgradeCount(world.content));
}
function clearChoices(store) {
  store.currentChoices.length = 0;
}
function resetProgressionState(world, store) {
  const curveInfo = resolveActiveProgressionCurve(world.content);
  store.level = 1;
  store.xp = 0;
  store.queuedLevelUps = 0;
  store.activeCurveIndex = curveInfo?.curveIndex ?? -1;
  store.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, 1);
  store.passiveUpgradeLevels.fill(0);
  clearChoices(store);
  store.initialized = true;
  store.lastResetTick = world.time.tick;
}
function ensureProgressionStore(world) {
  const base = world.stores.progression;
  const expectedPassiveCount = createPassiveLevelBuffer(world).length;
  if (!base.currentChoices) {
    base.currentChoices = [];
  }
  if (!base.passiveUpgradeLevels) {
    base.passiveUpgradeLevels = new Uint8Array(expectedPassiveCount);
  } else if (base.passiveUpgradeLevels.length !== expectedPassiveCount) {
    base.passiveUpgradeLevels = new Uint8Array(expectedPassiveCount);
  }
  if (typeof base.activeCurveIndex !== "number") {
    base.activeCurveIndex = -1;
  }
  if (typeof base.lastResetTick !== "number") {
    base.lastResetTick = -1;
  }
  if (!base.initialized || world.time.tick === 0 && base.lastResetTick !== 0) {
    resetProgressionState(world, base);
  } else {
    const curveInfo = resolveActiveProgressionCurve(world.content);
    base.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, base.level ?? 1);
    base.activeCurveIndex = curveInfo?.curveIndex ?? -1;
  }
  return base;
}
function clearUpgradeChoices(store) {
  store.currentChoices.length = 0;
}

// src/sim/world/World.ts
function createWorldRng(seed) {
  let state = seed >>> 0;
  return {
    get seed() {
      return state >>> 0;
    },
    next() {
      state = state + 1831565813 >>> 0;
      let t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    },
    reset(nextSeed) {
      state = nextSeed >>> 0;
    }
  };
}
function createDynamicWorldStore(capacity) {
  return {
    capacity,
    activeCount: 0,
    activeMask: new Uint8Array(capacity),
    generation: new Uint16Array(capacity),
    typeIds: new Uint16Array(capacity),
    posX: new Float32Array(capacity),
    posY: new Float32Array(capacity),
    reset() {
      this.activeCount = 0;
      this.activeMask.fill(0);
      this.typeIds.fill(0);
      this.posX.fill(0);
      this.posY.fill(0);
    }
  };
}
function createWorldStores(config, content) {
  return {
    player: createPlayerStore(),
    enemies: createEnemyStoreFromPlaceholder(createDynamicWorldStore(config.capacities.enemies)),
    projectiles: createProjectileStoreFromPlaceholder(
      createDynamicWorldStore(config.capacities.projectiles)
    ),
    pickups: createPickupStoreFromPlaceholder(createDynamicWorldStore(config.capacities.pickups)),
    progression: createProgressionStore(resolvePassiveUpgradeCount(content))
  };
}
function createWorldCommands() {
  return {
    enemySpawn: new EnemySpawnBuffer(),
    projectileSpawn: new ProjectileSpawnBuffer(),
    pickupSpawn: new PickupSpawnBuffer(),
    damage: new DamageBuffer(),
    xpGrant: new XpGrantBuffer(),
    despawn: new DespawnBuffer(),
    stateChange: new StateChangeBuffer()
  };
}
function createWorldScratch() {
  return {
    latestMoveMagnitude: 0,
    nextHealthPickupSpawnAtSeconds: 12,
    nextMagnetPickupSpawnAtSeconds: 18
  };
}
function createWorld(config, content, runState, seed) {
  return {
    config,
    content,
    seed,
    rng: createWorldRng(seed),
    runState: { current: runState },
    time: {
      tick: 0,
      elapsedSeconds: 0
    },
    stores: createWorldStores(config, content),
    commands: createWorldCommands(),
    scratch: createWorldScratch(),
    debug: createDebugCounters()
  };
}

// src/sim/world/WorldFactory.ts
function createWorldFactory(config, content) {
  return (seed, runState) => createWorld(config, content, runState, seed);
}

// src/sim/player/PlayerReset.ts
function isContentRegistry5(content) {
  const candidate = content;
  return typeof candidate === "object" && candidate !== null && typeof candidate.playerCharacters?.get === "function" && Array.isArray(candidate.playerCharacters.defs);
}
function resolvePlayerCharacterDef(content, preferredPlayerId) {
  if (!isContentRegistry5(content)) {
    return null;
  }
  if (preferredPlayerId && content.playerCharacters.has(preferredPlayerId)) {
    return content.playerCharacters.get(preferredPlayerId);
  }
  return content.playerCharacters.defs[0] ?? null;
}
function applyBaseStats(store, baseStats) {
  store.baseStats = clonePlayerBaseStats(baseStats);
  store.statSnapshot = rebuildPlayerStatSnapshot(store.baseStats, store.statModifiers);
  store.radius = store.statSnapshot.radius;
  store.maxHp = store.statSnapshot.maxHp;
  store.pickupRadius = store.statSnapshot.pickupRadius;
  store.hp = Math.min(store.hp, store.maxHp);
}
function rebuildPlayerRuntimeStats(store) {
  const previousMaxHp = store.maxHp;
  const previousHpRatio = previousMaxHp > 0 ? store.hp / previousMaxHp : 1;
  store.statSnapshot = rebuildPlayerStatSnapshot(store.baseStats, store.statModifiers);
  store.radius = store.statSnapshot.radius;
  store.maxHp = store.statSnapshot.maxHp;
  store.pickupRadius = store.statSnapshot.pickupRadius;
  store.hp = Math.min(store.maxHp, Math.max(0, previousHpRatio * store.maxHp));
}
function resetPlayerStore(store) {
  store.exists = false;
  store.isDead = false;
  store.characterId = null;
  store.posX = 0;
  store.posY = 0;
  store.velX = 0;
  store.velY = 0;
  store.facingX = 1;
  store.facingY = 0;
  store.invulnRemaining = 0;
  resetPlayerStatModifiers(store.statModifiers);
  applyBaseStats(store, DEFAULT_PLAYER_BASE_STATS);
  store.hp = store.maxHp;
}
function initializePlayerForRun(store, content, preferredPlayerId) {
  resetPlayerStore(store);
  const playerDef = resolvePlayerCharacterDef(content, preferredPlayerId);
  if (playerDef) {
    store.characterId = playerDef.id;
    applyBaseStats(store, playerDef.baseStats);
  }
  store.exists = true;
  store.isDead = false;
  store.hp = store.maxHp;
}

// src/sim/world/WorldReset.ts
function resetWorld(world, seed, runState) {
  world.seed = seed;
  world.rng.reset(seed);
  world.runState.current = runState;
  world.time.tick = 0;
  world.time.elapsedSeconds = 0;
  resetPlayerStore(world.stores.player);
  if (runState === RunState.StartingRun || runState === RunState.Running) {
    initializePlayerForRun(world.stores.player, world.content);
  }
  world.stores.player.debugInvulnerable = false;
  world.stores.enemies.reset();
  world.stores.projectiles.reset();
  world.stores.pickups.reset();
  world.stores.progression.level = 1;
  world.stores.progression.xp = 0;
  world.stores.progression.xpToNext = 5;
  world.stores.progression.queuedLevelUps = 0;
  world.stores.progression.currentChoices.length = 0;
  world.stores.progression.passiveUpgradeLevels.fill(0);
  world.stores.progression.activeCurveIndex = -1;
  world.stores.progression.initialized = false;
  world.stores.progression.lastResetTick = -1;
  world.commands.enemySpawn.clear();
  world.commands.projectileSpawn.clear();
  world.commands.pickupSpawn.clear();
  world.commands.damage.clear();
  world.commands.xpGrant.clear();
  world.commands.despawn.clear();
  world.commands.stateChange.clear();
  world.scratch.latestMoveMagnitude = 0;
  world.scratch.nextHealthPickupSpawnAtSeconds = 12;
  world.scratch.nextMagnetPickupSpawnAtSeconds = 18;
  world.debug.tick = 0;
  world.debug.gameplayTicks = 0;
  world.debug.droppedFrameSubsteps = 0;
  world.debug.lastFrameSubsteps = 0;
  world.debug.estimatedStepSeconds = 0;
  world.debug.lastRunStateChangeReason = "reset";
  for (const counter of Object.values(world.debug.systemCounters)) {
    counter.executedTicks = 0;
    counter.skippedTicks = 0;
  }
}

// src/sim/progression/UpgradeApply.ts
function isContentRegistry6(content) {
  const registry = content;
  return typeof content === "object" && content !== null && !!registry.weapons && !!registry.passiveUpgrades && Array.isArray(registry.weapons.defs) && Array.isArray(registry.passiveUpgrades.defs);
}
function findWeaponSlotByType(world, weaponTypeId) {
  const weapons = ensureWeaponRuntimeStore(world);
  for (let slot = 0; slot < weapons.activeCount; slot += 1) {
    if (weapons.weaponTypeIds[slot] === weaponTypeId) {
      return slot;
    }
  }
  return -1;
}
function applyPassiveUpgrade(world, progression, choice) {
  if (!isContentRegistry6(world.content)) {
    return false;
  }
  const passiveDef = world.content.passiveUpgrades.defs[choice.contentIndex];
  if (!passiveDef) {
    return false;
  }
  const currentLevel = progression.passiveUpgradeLevels[choice.contentIndex] ?? 0;
  if (currentLevel >= passiveDef.maxLevel) {
    return false;
  }
  progression.passiveUpgradeLevels[choice.contentIndex] = currentLevel + 1;
  const modifiers = passiveDef.modifiersByLevel[currentLevel] ?? [];
  applyPlayerStatModifiers(world.stores.player.statModifiers, modifiers);
  rebuildPlayerRuntimeStats(world.stores.player);
  return true;
}
function applyWeaponUnlock(world, choice) {
  if (!isContentRegistry6(world.content)) {
    return false;
  }
  const weaponDef = world.content.weapons.defs[choice.contentIndex];
  if (!weaponDef) {
    return false;
  }
  const weapons = ensureWeaponRuntimeStore(world);
  if (findWeaponSlotByType(world, choice.contentIndex) >= 0) {
    return false;
  }
  weapons.ensureCapacity(weapons.activeCount + 1);
  const slot = weapons.activeCount;
  weapons.weaponTypeIds[slot] = choice.contentIndex;
  weapons.weaponLevels[slot] = 1;
  weapons.cooldownRemaining[slot] = 0;
  weapons.activeCount += 1;
  return true;
}
function applyWeaponLevel(world, choice) {
  if (!isContentRegistry6(world.content)) {
    return false;
  }
  const weaponDef = world.content.weapons.defs[choice.contentIndex];
  if (!weaponDef) {
    return false;
  }
  const slot = findWeaponSlotByType(world, choice.contentIndex);
  if (slot < 0) {
    return false;
  }
  const weapons = ensureWeaponRuntimeStore(world);
  const currentLevel = weapons.weaponLevels[slot] ?? 0;
  if (currentLevel >= weaponDef.maxLevel) {
    return false;
  }
  weapons.weaponLevels[slot] = currentLevel + 1;
  return true;
}
function applyUpgradeChoice(world, progression, choice) {
  switch (choice.kind) {
    case "passive":
      return applyPassiveUpgrade(world, progression, choice);
    case "weapon_unlock":
      return applyWeaponUnlock(world, choice);
    case "weapon_level":
      return applyWeaponLevel(world, choice);
    default:
      return false;
  }
}

// src/sim/progression/UpgradeChoice.ts
var MAX_UPGRADE_CHOICES = 3;

// src/sim/progression/UpgradeRoller.ts
function isContentRegistry7(content) {
  const registry = content;
  return typeof content === "object" && content !== null && !!registry.weapons && !!registry.passiveUpgrades && Array.isArray(registry.weapons.defs) && Array.isArray(registry.passiveUpgrades.defs);
}
function createPassiveChoice(passiveDef, passiveIndex, currentLevel) {
  const nextLevel = currentLevel + 1;
  return {
    choiceId: `passive:${passiveDef.id}:${nextLevel}`,
    kind: "passive",
    contentIndex: passiveIndex,
    contentId: passiveDef.id,
    displayName: passiveDef.displayName,
    description: passiveDef.description,
    iconKey: passiveDef.iconKey,
    currentLevel,
    nextLevel,
    maxLevel: passiveDef.maxLevel
  };
}
function createWeaponUnlockChoice(weaponDef, weaponIndex) {
  return {
    choiceId: `weapon_unlock:${weaponDef.id}`,
    kind: "weapon_unlock",
    contentIndex: weaponIndex,
    contentId: weaponDef.id,
    displayName: weaponDef.displayName,
    description: weaponDef.description,
    iconKey: weaponDef.iconKey,
    currentLevel: 0,
    nextLevel: 1,
    maxLevel: weaponDef.maxLevel
  };
}
function createWeaponLevelChoice(weaponDef, weaponIndex, currentLevel) {
  return {
    choiceId: `weapon_level:${weaponDef.id}:${currentLevel + 1}`,
    kind: "weapon_level",
    contentIndex: weaponIndex,
    contentId: weaponDef.id,
    displayName: weaponDef.displayName,
    description: weaponDef.description,
    iconKey: weaponDef.iconKey,
    currentLevel,
    nextLevel: currentLevel + 1,
    maxLevel: weaponDef.maxLevel
  };
}
function buildWeaponSlotMap(weaponTypeIds, activeCount, weaponCount) {
  const slotsByType = new Int16Array(weaponCount);
  slotsByType.fill(-1);
  for (let slot = 0; slot < activeCount; slot += 1) {
    slotsByType[weaponTypeIds[slot]] = slot;
  }
  return slotsByType;
}
function buildCandidates(world, progression) {
  if (!isContentRegistry7(world.content)) {
    return [];
  }
  const candidates = [];
  const weaponStore = ensureWeaponRuntimeStore(world);
  const weaponDefs = world.content.weapons.defs;
  const weaponSlotsByType = buildWeaponSlotMap(
    weaponStore.weaponTypeIds,
    weaponStore.activeCount,
    weaponDefs.length
  );
  const maxWeaponSlots = Math.min(weaponDefs.length, 3);
  for (let passiveIndex = 0; passiveIndex < world.content.passiveUpgrades.defs.length; passiveIndex += 1) {
    const passiveDef = world.content.passiveUpgrades.defs[passiveIndex];
    const currentLevel = progression.passiveUpgradeLevels[passiveIndex] ?? 0;
    if (currentLevel >= passiveDef.maxLevel) {
      continue;
    }
    candidates.push({
      choice: createPassiveChoice(passiveDef, passiveIndex, currentLevel),
      weight: 1.2
    });
  }
  for (let weaponIndex = 0; weaponIndex < weaponDefs.length; weaponIndex += 1) {
    const weaponDef = weaponDefs[weaponIndex];
    const weaponSlot = weaponSlotsByType[weaponIndex];
    if (weaponSlot >= 0) {
      const currentLevel = weaponStore.weaponLevels[weaponSlot] ?? 0;
      if (currentLevel < weaponDef.maxLevel) {
        candidates.push({
          choice: createWeaponLevelChoice(weaponDef, weaponIndex, currentLevel),
          weight: 1.5
        });
      }
      continue;
    }
    if (weaponStore.activeCount >= maxWeaponSlots) {
      continue;
    }
    candidates.push({
      choice: createWeaponUnlockChoice(weaponDef, weaponIndex),
      weight: weaponDef.behavior === "projectile" ? 1.4 : 0.8
    });
  }
  return candidates;
}
function chooseCandidateIndex(candidates, roll) {
  let totalWeight = 0;
  for (let index = 0; index < candidates.length; index += 1) {
    totalWeight += candidates[index].weight;
  }
  if (totalWeight <= 0) {
    return 0;
  }
  let cursor = roll * totalWeight;
  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= candidates[index].weight;
    if (cursor <= 0) {
      return index;
    }
  }
  return candidates.length - 1;
}
function rollUpgradeChoices(world, progression, maxChoices = MAX_UPGRADE_CHOICES) {
  const candidates = buildCandidates(world, progression);
  const selectedChoices = [];
  while (candidates.length > 0 && selectedChoices.length < maxChoices) {
    const candidateIndex = chooseCandidateIndex(candidates, world.rng.next());
    const [candidate] = candidates.splice(candidateIndex, 1);
    if (!candidate) {
      break;
    }
    selectedChoices.push(candidate.choice);
  }
  progression.currentChoices.length = 0;
  progression.currentChoices.push(...selectedChoices);
  return progression.currentChoices;
}

// src/sim/progression/ProgressionApi.ts
function getLevelUpPayload(world) {
  const progression = ensureProgressionStore(world);
  if (progression.currentChoices.length === 0) {
    return null;
  }
  return {
    level: progression.level,
    xp: progression.xp,
    xpToNext: progression.xpToNext,
    queuedLevelUps: progression.queuedLevelUps,
    choiceCount: progression.currentChoices.length,
    choices: progression.currentChoices
  };
}
function ensureLevelUpChoices(world) {
  const progression = ensureProgressionStore(world);
  if (progression.currentChoices.length === 0 && progression.queuedLevelUps > 0) {
    rollUpgradeChoices(world, progression);
  }
  return getLevelUpPayload(world);
}
function selectUpgrade(world, choiceIndex) {
  const progression = ensureProgressionStore(world);
  const choice = progression.currentChoices[choiceIndex];
  if (!choice) {
    return false;
  }
  const applied = applyUpgradeChoice(world, progression, choice);
  if (!applied) {
    return false;
  }
  if (progression.queuedLevelUps > 0) {
    progression.queuedLevelUps -= 1;
  }
  clearUpgradeChoices(progression);
  if (progression.queuedLevelUps > 0) {
    rollUpgradeChoices(world, progression);
    if (world.runState.current !== RunState.LevelUpChoice) {
      world.commands.stateChange.enqueue(RunState.LevelUpChoice, "levelup-choice-queued");
    }
    return true;
  }
  world.commands.stateChange.enqueue(RunState.Running, "levelup-choice-resolved");
  return true;
}

// src/sim/core/RunStateTransition.ts
function applyRunState(world, nextState, reason) {
  if (!canTransitionRunState(world.runState.current, nextState)) {
    return;
  }
  world.runState.current = nextState;
  world.debug.lastRunStateChangeReason = reason;
}

// src/sim/spatial/SpatialGrid.ts
var DEFAULT_GRID_CELL_SIZE = 64;
function cellCoord(value, cellSize) {
  return Math.floor(value / cellSize);
}
function createCellKey(cellX, cellY) {
  return cellX * 73856093 ^ cellY * 19349663;
}
function createSpatialGrid(cellSize = DEFAULT_GRID_CELL_SIZE) {
  return {
    cellSize,
    buckets: /* @__PURE__ */ new Map(),
    activeKeys: [],
    scratchResults: [],
    reset() {
      for (let index = 0; index < this.activeKeys.length; index += 1) {
        const key = this.activeKeys[index];
        const bucket = this.buckets.get(key);
        if (bucket) {
          bucket.length = 0;
        }
      }
      this.activeKeys.length = 0;
      this.scratchResults.length = 0;
    },
    rebuildEnemyOccupancy(world) {
      this.reset();
      const store = ensureEnemyStore(world);
      for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
        const slot = store.activeSlots[denseIndex];
        const key = createCellKey(
          cellCoord(store.posX[slot], this.cellSize),
          cellCoord(store.posY[slot], this.cellSize)
        );
        let bucket = this.buckets.get(key);
        if (!bucket) {
          bucket = [];
          this.buckets.set(key, bucket);
        }
        if (bucket.length === 0) {
          this.activeKeys.push(key);
        }
        bucket.push(slot);
      }
    }
  };
}
function ensureSpatialGrid(world) {
  if (!world.scratch.spatialGrid) {
    world.scratch.spatialGrid = createSpatialGrid();
  }
  return world.scratch.spatialGrid;
}

// src/sim/combat/DamageTypes.ts
var PLAYER_TEAM = 1;
function clampDamageAmount(amount) {
  return amount > 0 ? amount : 0;
}
function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = bx - ax;
  const dy = by - ay;
  const radiusSum = ar + br;
  return dx * dx + dy * dy <= radiusSum * radiusSum;
}

// src/sim/combat/ContactDamageQuerySystem.ts
function queryContactDamage(context) {
  const player = context.world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }
  const enemies = ensureEnemyStore(context.world);
  const spatialGrid = ensureSpatialGrid(context.world);
  const minCellX = cellCoord(player.posX - player.radius, spatialGrid.cellSize);
  const maxCellX = cellCoord(player.posX + player.radius, spatialGrid.cellSize);
  const minCellY = cellCoord(player.posY - player.radius, spatialGrid.cellSize);
  const maxCellY = cellCoord(player.posY + player.radius, spatialGrid.cellSize);
  for (let cellYIndex = minCellY; cellYIndex <= maxCellY; cellYIndex += 1) {
    for (let cellXIndex = minCellX; cellXIndex <= maxCellX; cellXIndex += 1) {
      const bucket = spatialGrid.buckets.get(createCellKey(cellXIndex, cellYIndex));
      if (!bucket) {
        continue;
      }
      for (let bucketIndex = 0; bucketIndex < bucket.length; bucketIndex += 1) {
        const enemySlot = bucket[bucketIndex];
        if (!enemies.isAlive(enemySlot)) {
          continue;
        }
        const enemyDamage = enemies.contactDamage[enemySlot];
        if (enemyDamage <= 0) {
          continue;
        }
        if (!circlesOverlap(
          player.posX,
          player.posY,
          player.radius,
          enemies.posX[enemySlot],
          enemies.posY[enemySlot],
          enemies.radius[enemySlot]
        )) {
          continue;
        }
        context.world.commands.damage.enqueue("player", 0, enemyDamage, "contact", enemySlot);
      }
    }
  }
}

// src/sim/player/PlayerMovementSystem.ts
function normalizeMovementInput(moveX, moveY) {
  const magnitude = Math.hypot(moveX, moveY);
  if (magnitude <= 0) {
    return { x: 0, y: 0, magnitude: 0 };
  }
  return {
    x: moveX / magnitude,
    y: moveY / magnitude,
    magnitude: 1
  };
}
function stepPlayerMovement(context) {
  const { frameInput, dt, world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    player.velX = 0;
    player.velY = 0;
    return;
  }
  const direction = normalizeMovementInput(frameInput.moveX, frameInput.moveY);
  const speed = player.statSnapshot.moveSpeed;
  player.velX = direction.x * speed;
  player.velY = direction.y * speed;
  player.posX += player.velX * dt;
  player.posY += player.velY * dt;
  clampPlayerToBounds(player, context.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player);
  if (direction.magnitude > 0) {
    player.facingX = direction.x;
    player.facingY = direction.y;
  }
}
function clampPlayerToBounds(player, bounds) {
  player.posX = Math.max(bounds.minX, Math.min(bounds.maxX, player.posX));
  player.posY = Math.max(bounds.minY, Math.min(bounds.maxY, player.posY));
}

// src/sim/player/PlayerDamageSystem.ts
function resolveMitigatedDamage(player, amount) {
  return Math.max(0, amount - player.statSnapshot.armor);
}
function tickPlayerInvulnerability(player, dt) {
  if (player.invulnRemaining <= 0) {
    return;
  }
  player.invulnRemaining = Math.max(0, player.invulnRemaining - dt);
}
function applyDamageToPlayer(player, amount, _sourceKind) {
  if (!player.exists || player.isDead || amount <= 0 || player.debugInvulnerable || player.invulnRemaining > 0) {
    return { applied: false, amountApplied: 0, killedPlayer: false };
  }
  const amountApplied = resolveMitigatedDamage(player, amount);
  if (amountApplied <= 0) {
    return { applied: false, amountApplied: 0, killedPlayer: false };
  }
  player.hp = Math.max(0, player.hp - amountApplied);
  player.invulnRemaining = player.invulnerabilityDurationSeconds;
  if (player.hp > 0) {
    return { applied: true, amountApplied, killedPlayer: false };
  }
  player.isDead = true;
  player.velX = 0;
  player.velY = 0;
  return { applied: true, amountApplied, killedPlayer: true };
}

// src/sim/enemies/EnemyLifecycle.ts
function createEnemyDeathInfo(world, slot) {
  const store = ensureEnemyStore(world);
  if (!store.isAlive(slot)) {
    return null;
  }
  return {
    slot,
    archetypeIndex: store.typeIds[slot],
    x: store.posX[slot],
    y: store.posY[slot],
    xpValue: store.xpValue[slot]
  };
}
function releaseEnemy(world, slot) {
  const store = ensureEnemyStore(world);
  return store.release(slot);
}

// src/sim/combat/DamageResolveSystem.ts
var xpPickupIndexCache = /* @__PURE__ */ new WeakMap();
var mediumXpPickupIndexCache = /* @__PURE__ */ new WeakMap();
var largeXpPickupIndexCache = /* @__PURE__ */ new WeakMap();
function isContentRegistry8(value) {
  const registry = value;
  return typeof value === "object" && value !== null && !!registry.pickups && Array.isArray(registry.pickups.defs);
}
function getDefaultXpPickupIndex(content) {
  return getPickupIndexById(content, "pickup.xp_small", xpPickupIndexCache, "xp");
}
function getMediumXpPickupIndex(content) {
  return getPickupIndexById(content, "pickup.xp_medium", mediumXpPickupIndexCache, "xp");
}
function getLargeXpPickupIndex(content) {
  return getPickupIndexById(content, "pickup.xp_large", largeXpPickupIndexCache, "xp");
}
function getPickupIndexById(content, pickupId2, cache, fallbackGrantKind) {
  if (!isContentRegistry8(content)) {
    return -1;
  }
  const cacheKey = content;
  const cached = cache.get(cacheKey);
  if (cached !== void 0) {
    return cached;
  }
  let foundIndex = -1;
  for (let index = 0; index < content.pickups.defs.length; index += 1) {
    if (content.pickups.defs[index].id === pickupId2) {
      foundIndex = index;
      break;
    }
  }
  if (foundIndex < 0) {
    for (let index = 0; index < content.pickups.defs.length; index += 1) {
      if (content.pickups.defs[index].grantKind === fallbackGrantKind) {
        foundIndex = index;
        break;
      }
    }
  }
  cache.set(cacheKey, foundIndex);
  return foundIndex;
}
function getXpPickupDef(content, pickupIndex) {
  if (!isContentRegistry8(content) || pickupIndex < 0) {
    return null;
  }
  return content.pickups.defs[pickupIndex] ?? null;
}
function emitEnemyDeathConsequences(context, slot) {
  const deathInfo = createEnemyDeathInfo(context.world, slot);
  if (!deathInfo) {
    return;
  }
  const xpAmount = Math.max(0, deathInfo.xpValue);
  if (xpAmount > 0) {
    const xpPickupIndex = xpAmount >= 24 ? getLargeXpPickupIndex(context.world.content) : xpAmount >= 8 ? getMediumXpPickupIndex(context.world.content) : getDefaultXpPickupIndex(context.world.content);
    const pickupDef = getXpPickupDef(context.world.content, xpPickupIndex);
    if (pickupDef) {
      context.world.commands.pickupSpawn.enqueue(
        xpPickupIndex,
        deathInfo.x,
        deathInfo.y,
        pickupDef.radius,
        xpAmount
      );
    } else {
      context.world.commands.xpGrant.enqueue(xpAmount);
    }
  }
  releaseEnemy(context.world, slot);
}
function resolveDamage(context) {
  const { dt, world } = context;
  const player = world.stores.player;
  const enemies = ensureEnemyStore(world);
  const damageBuffer = world.commands.damage;
  tickPlayerInvulnerability(player, dt);
  const damageCount = damageBuffer.count;
  for (let index = 0; index < damageCount; index += 1) {
    const command = damageBuffer.get(index);
    const amount = clampDamageAmount(command.amount);
    if (amount <= 0) {
      continue;
    }
    if (command.targetKind === "player") {
      const result = applyDamageToPlayer(player, amount, command.sourceKind);
      if (result.killedPlayer) {
        world.commands.stateChange.enqueue(RunState.GameOver, "player-death");
      }
      continue;
    }
    if (!enemies.isAlive(command.targetId)) {
      continue;
    }
    enemies.hp[command.targetId] = Math.max(0, enemies.hp[command.targetId] - amount);
    if (enemies.hp[command.targetId] > 0) {
      continue;
    }
    emitEnemyDeathConsequences(context, command.targetId);
  }
  damageBuffer.clear();
}

// src/sim/combat/WeaponRuntimeContent.ts
var weaponRuntimeCache = /* @__PURE__ */ new WeakMap();
function isContentRegistry9(value) {
  const registry = value;
  return typeof value === "object" && value !== null && !!registry.weapons && !!registry.projectiles && Array.isArray(registry.weapons.defs) && Array.isArray(registry.projectiles.defs);
}
function buildWeaponRuntimeContent(content) {
  return {
    weapons: content.weapons.defs.map((def, contentIndex) => ({
      ...def,
      contentIndex,
      projectileIndex: def.projectileId ? content.projectiles.getIndex(def.projectileId) : -1
    }))
  };
}
function getWeaponRuntimeContent(content) {
  if (!isContentRegistry9(content)) {
    return null;
  }
  const cacheKey = content;
  const cached = weaponRuntimeCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const built = buildWeaponRuntimeContent(content);
  weaponRuntimeCache.set(cacheKey, built);
  return built;
}
function getWeaponDefByIndex(content, weaponIndex) {
  const runtime = getWeaponRuntimeContent(content);
  if (!runtime) {
    return null;
  }
  return runtime.weapons[weaponIndex] ?? null;
}

// src/sim/combat/WeaponTargeting.ts
function getEnemyTargetPriority(xpValue) {
  if (xpValue >= 24) {
    return 2;
  }
  if (xpValue >= 12) {
    return 1;
  }
  return 0;
}
function findNearestEnemySlot(world, originX, originY, maxRange = Number.POSITIVE_INFINITY) {
  const enemies = ensureEnemyStore(world);
  const maxRangeSq = maxRange * maxRange;
  let bestSlot = -1;
  let bestPriority = -1;
  let bestDistanceSq = maxRangeSq;
  for (let denseIndex = 0; denseIndex < enemies.activeCount; denseIndex += 1) {
    const slot = enemies.activeSlots[denseIndex];
    const dx = enemies.posX[slot] - originX;
    const dy = enemies.posY[slot] - originY;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > maxRangeSq) {
      continue;
    }
    const priority = getEnemyTargetPriority(enemies.xpValue[slot]);
    if (priority < bestPriority) {
      continue;
    }
    if (priority === bestPriority && distanceSq > bestDistanceSq) {
      continue;
    }
    bestPriority = priority;
    bestDistanceSq = distanceSq;
    bestSlot = slot;
  }
  return bestSlot;
}

// src/sim/combat/WeaponFireSystem.ts
var MIN_WEAPON_COOLDOWN_SECONDS = 0.05;
var PROJECTILE_SPAWN_OFFSET = 4;
var SPREAD_RADIANS = 0.16;
var WEAPON_LEVEL_DAMAGE_BONUS = 0.15;
var WEAPON_LEVEL_AREA_BONUS2 = 0.1;
var WEAPON_LEVEL_COOLDOWN_BONUS = 0.04;
function getProjectileDef(context, projectileIndex) {
  const projectiles = context.world.content.projectiles;
  if (!projectiles || !Array.isArray(projectiles.defs)) {
    return null;
  }
  return projectiles.defs[projectileIndex] ?? null;
}
function resolveAimVector(context, targetSlot) {
  const player = context.world.stores.player;
  if (targetSlot >= 0) {
    const enemies = ensureEnemyStore(context.world);
    const dx = enemies.posX[targetSlot] - player.posX;
    const dy = enemies.posY[targetSlot] - player.posY;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      return {
        x: dx / length,
        y: dy / length
      };
    }
  }
  const facingLength = Math.hypot(player.facingX, player.facingY);
  if (facingLength > 0) {
    return {
      x: player.facingX / facingLength,
      y: player.facingY / facingLength
    };
  }
  return { x: 1, y: 0 };
}
function rotateDirection(baseX, baseY, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: baseX * cos - baseY * sin,
    y: baseX * sin + baseY * cos
  };
}
function fireProjectileBurst(context, projectileDef, projectileTypeId, shotCount, damage, pierceCount) {
  const player = context.world.stores.player;
  const targetSlot = findNearestEnemySlot(context.world, player.posX, player.posY);
  if (targetSlot < 0) {
    return false;
  }
  const aim = resolveAimVector(context, targetSlot);
  const spreadCenter = (shotCount - 1) * 0.5;
  const projectileRadius = projectileDef.radius * player.statSnapshot.areaMultiplier;
  const projectileLifetime = projectileDef.lifetimeSeconds * player.statSnapshot.durationMultiplier;
  for (let shotIndex = 0; shotIndex < shotCount; shotIndex += 1) {
    const spreadOffset = (shotIndex - spreadCenter) * SPREAD_RADIANS;
    const shotDir = rotateDirection(aim.x, aim.y, spreadOffset);
    const spawnDistance = player.radius + projectileRadius + PROJECTILE_SPAWN_OFFSET;
    context.world.commands.projectileSpawn.enqueueValues(
      projectileTypeId,
      PLAYER_TEAM,
      player.posX + shotDir.x * spawnDistance,
      player.posY + shotDir.y * spawnDistance,
      shotDir.x * projectileDef.speed,
      shotDir.y * projectileDef.speed,
      projectileRadius,
      damage,
      projectileLifetime,
      pierceCount,
      projectileDef.collisionFlags
    );
  }
  return true;
}
function getWeaponLevelBonusMultiplier(level, perLevelBonus) {
  return 1 + Math.max(0, level - 1) * perLevelBonus;
}
function getWeaponCooldownSeconds(baseCooldownSeconds, level, cooldownMultiplier) {
  const levelScale = Math.max(0.5, 1 - Math.max(0, level - 1) * WEAPON_LEVEL_COOLDOWN_BONUS);
  return Math.max(
    MIN_WEAPON_COOLDOWN_SECONDS,
    baseCooldownSeconds * levelScale * cooldownMultiplier
  );
}
function computeWeaponDamage(baseDamage, level, might) {
  return baseDamage * getWeaponLevelBonusMultiplier(level, WEAPON_LEVEL_DAMAGE_BONUS) * might;
}
function computeWeaponArea(baseAreaRadius, level, areaMultiplier) {
  return baseAreaRadius * getWeaponLevelBonusMultiplier(level, WEAPON_LEVEL_AREA_BONUS2) * areaMultiplier;
}
function applyAreaDamage(context, centerX, centerY, radius, damage, sourceId) {
  if (radius <= 0 || damage <= 0) {
    return false;
  }
  const enemies = ensureEnemyStore(context.world);
  let hitAny = false;
  for (let denseIndex = 0; denseIndex < enemies.activeCount; denseIndex += 1) {
    const slot = enemies.activeSlots[denseIndex];
    const dx = enemies.posX[slot] - centerX;
    const dy = enemies.posY[slot] - centerY;
    const hitRadius = radius + enemies.radius[slot];
    if (dx * dx + dy * dy > hitRadius * hitRadius) {
      continue;
    }
    context.world.commands.damage.enqueue(
      "enemy",
      slot,
      damage,
      "projectile",
      sourceId
    );
    hitAny = true;
  }
  return hitAny;
}
function stepWeaponFire(context) {
  const player = context.world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }
  const weapons = ensureWeaponRuntimeStore(context.world);
  if (weapons.activeCount === 0) {
    return;
  }
  for (let slot = 0; slot < weapons.activeCount; slot += 1) {
    const weaponDef = getWeaponDefByIndex(context.world.content, weapons.weaponTypeIds[slot]);
    if (!weaponDef) {
      continue;
    }
    const weaponLevel = Math.max(1, weapons.weaponLevels[slot] ?? 1);
    const nextCooldown = Math.max(0, weapons.cooldownRemaining[slot] - context.dt);
    weapons.cooldownRemaining[slot] = nextCooldown;
    if (nextCooldown > 0) {
      continue;
    }
    let didFire = false;
    if (weaponDef.behavior === "projectile" && weaponDef.projectileIndex >= 0) {
      const projectileDef = getProjectileDef(context, weaponDef.projectileIndex);
      if (!projectileDef) {
        continue;
      }
      const shotCount = Math.max(
        1,
        weaponDef.shotsPerFire + Math.floor((weaponLevel - 1) / 2) + Math.max(0, player.statSnapshot.projectileCount - 1)
      );
      const damage = computeWeaponDamage(
        projectileDef.baseDamage * weaponDef.baseDamageMultiplier,
        weaponLevel,
        player.statSnapshot.might
      );
      didFire = fireProjectileBurst(
        context,
        projectileDef,
        weaponDef.projectileIndex,
        shotCount,
        damage,
        projectileDef.maxPierce + weaponDef.basePierceBonus
      );
    } else if (weaponDef.behavior === "aura") {
      const radius = computeWeaponArea(
        player.radius + weaponDef.baseAreaRadius,
        weaponLevel,
        player.statSnapshot.areaMultiplier
      );
      const damage = computeWeaponDamage(
        10 * weaponDef.baseDamageMultiplier,
        weaponLevel,
        player.statSnapshot.might
      );
      didFire = applyAreaDamage(context, player.posX, player.posY, radius, damage, slot);
    } else if (weaponDef.behavior === "nova") {
      const radius = computeWeaponArea(
        player.radius + weaponDef.baseAreaRadius,
        weaponLevel,
        player.statSnapshot.areaMultiplier
      );
      const damage = computeWeaponDamage(
        14 * weaponDef.baseDamageMultiplier,
        weaponLevel,
        player.statSnapshot.might
      );
      didFire = applyAreaDamage(context, player.posX, player.posY, radius, damage, slot);
    }
    weapons.cooldownRemaining[slot] = didFire ? getWeaponCooldownSeconds(
      weaponDef.baseCooldownSeconds,
      weaponLevel,
      player.statSnapshot.cooldownMultiplier
    ) : Math.max(0.1, Math.min(0.25, weaponDef.baseCooldownSeconds * 0.2));
    if (didFire) {
      weapons.lastFireElapsedSeconds[slot] = context.world.time.elapsedSeconds;
    }
  }
}

// src/sim/enemies/EnemyMovementSystem.ts
var MIN_DIRECTION_DISTANCE = 1e-4;
var SEPARATION_RADIUS_SCALE = 1.5;
var SEPARATION_FORCE = 0.85;
function stepEnemyMovement(context) {
  const { dt, world } = context;
  const store = ensureEnemyStore(world);
  const spatialGrid = ensureSpatialGrid(world);
  const player = world.stores.player;
  const targetX = player.exists ? player.posX : 0;
  const targetY = player.exists ? player.posY : 0;
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    const dx = targetX - store.posX[slot];
    const dy = targetY - store.posY[slot];
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= MIN_DIRECTION_DISTANCE) {
      store.velX[slot] = 0;
      store.velY[slot] = 0;
      continue;
    }
    const distance = Math.sqrt(distanceSquared);
    const nx = dx / distance;
    const ny = dy / distance;
    const speed = store.moveSpeed[slot];
    const separationRadius = Math.max(store.radius[slot] * SEPARATION_RADIUS_SCALE, 1);
    let separationX = 0;
    let separationY = 0;
    const minCellX = cellCoord(store.posX[slot] - separationRadius, spatialGrid.cellSize);
    const maxCellX = cellCoord(store.posX[slot] + separationRadius, spatialGrid.cellSize);
    const minCellY = cellCoord(store.posY[slot] - separationRadius, spatialGrid.cellSize);
    const maxCellY = cellCoord(store.posY[slot] + separationRadius, spatialGrid.cellSize);
    for (let cellYIndex = minCellY; cellYIndex <= maxCellY; cellYIndex += 1) {
      for (let cellXIndex = minCellX; cellXIndex <= maxCellX; cellXIndex += 1) {
        const bucket = spatialGrid.buckets.get(createCellKey(cellXIndex, cellYIndex));
        if (!bucket) {
          continue;
        }
        for (let bucketIndex = 0; bucketIndex < bucket.length; bucketIndex += 1) {
          const otherSlot = bucket[bucketIndex];
          if (otherSlot === slot || !store.isAlive(otherSlot)) {
            continue;
          }
          const offsetX = store.posX[slot] - store.posX[otherSlot];
          const offsetY = store.posY[slot] - store.posY[otherSlot];
          const combinedRadius = store.radius[slot] + store.radius[otherSlot];
          const separationDistanceSquared = offsetX * offsetX + offsetY * offsetY;
          if (separationDistanceSquared <= MIN_DIRECTION_DISTANCE) {
            const tieBreaker = slot < otherSlot ? -1 : 1;
            separationY += tieBreaker;
            continue;
          }
          const separationDistance = Math.sqrt(separationDistanceSquared);
          if (separationDistance >= combinedRadius || separationDistance >= separationRadius) {
            continue;
          }
          const overlapRatio = 1 - separationDistance / Math.max(combinedRadius, separationRadius);
          separationX += offsetX / separationDistance * overlapRatio;
          separationY += offsetY / separationDistance * overlapRatio;
        }
      }
    }
    const moveX = nx + separationX * SEPARATION_FORCE;
    const moveY = ny + separationY * SEPARATION_FORCE;
    const moveMagnitude = Math.hypot(moveX, moveY);
    const finalX = moveMagnitude > MIN_DIRECTION_DISTANCE ? moveX / moveMagnitude : nx;
    const finalY = moveMagnitude > MIN_DIRECTION_DISTANCE ? moveY / moveMagnitude : ny;
    store.velX[slot] = finalX * speed;
    store.velY[slot] = finalY * speed;
    store.posX[slot] += store.velX[slot] * dt;
    store.posY[slot] += store.velY[slot] * dt;
  }
}

// src/sim/enemies/EnemyArchetypeRuntime.ts
var enemyRuntimeCache = /* @__PURE__ */ new WeakMap();
function isContentRegistry10(value) {
  const registry = value;
  return typeof value === "object" && value !== null && !!registry.enemyArchetypes && !!registry.waves && Array.isArray(registry.enemyArchetypes.ids) && Array.isArray(registry.waves.ids);
}
function buildEnemyRuntimeContent(content) {
  const archetypes = content.enemyArchetypes.defs.map((def, contentIndex) => ({
    ...def,
    contentIndex
  }));
  const waves = content.waves.defs.map((wave, contentIndex) => ({
    ...wave,
    contentIndex,
    spawnEntries: wave.spawnEntries.map((entry) => ({
      ...entry,
      enemyIndex: content.enemyArchetypes.getIndex(entry.enemyId)
    }))
  }));
  return { archetypes, waves };
}
function getEnemyRuntimeContent(content) {
  if (!isContentRegistry10(content)) {
    return null;
  }
  const cacheKey = content;
  const cached = enemyRuntimeCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const built = buildEnemyRuntimeContent(content);
  enemyRuntimeCache.set(cacheKey, built);
  return built;
}
function getEnemyArchetypeByIndex(content, archetypeIndex) {
  const runtime = getEnemyRuntimeContent(content);
  if (!runtime) {
    return null;
  }
  return runtime.archetypes[archetypeIndex] ?? null;
}
function getDefaultEnemyWave(content) {
  const runtime = getEnemyRuntimeContent(content);
  if (!runtime || runtime.waves.length === 0) {
    return null;
  }
  return runtime.waves[0];
}

// src/sim/enemies/EnemySpawnSystem.ts
function applyEnemySpawnCommands(context) {
  const { world } = context;
  const store = ensureEnemyStore(world);
  const commandCount = world.commands.enemySpawn.count;
  for (let commandIndex = 0; commandIndex < commandCount; commandIndex += 1) {
    const command = world.commands.enemySpawn.get(commandIndex);
    const archetype = getEnemyArchetypeByIndex(world.content, command.archetypeId);
    if (!archetype) {
      continue;
    }
    const slot = store.allocate();
    store.typeIds[slot] = archetype.contentIndex;
    store.posX[slot] = command.x;
    store.posY[slot] = command.y;
    store.velX[slot] = 0;
    store.velY[slot] = 0;
    store.radius[slot] = archetype.radius;
    store.hp[slot] = archetype.maxHp;
    store.maxHp[slot] = archetype.maxHp;
    store.moveSpeed[slot] = archetype.moveSpeed;
    store.contactDamage[slot] = archetype.contactDamage;
    store.xpValue[slot] = archetype.xpValue;
    store.flags[slot] = archetype.collisionFlags;
  }
  world.commands.enemySpawn.clear();
}

// src/sim/enemies/SpawnDirector.ts
var DEFAULT_SPAWN_SAFE_RADIUS = 340;
var DEFAULT_SPAWN_RING_THICKNESS = 180;
var DEFAULT_MAX_ACTIVE_ENEMIES = 500;
var DEFAULT_EDGE_SPAWN_MARGIN = 220;
function createSpawnDirectorState(wave) {
  return {
    initialized: false,
    waveContentIndex: wave?.contentIndex ?? -1,
    maxActiveEnemies: DEFAULT_MAX_ACTIVE_ENEMIES,
    safeRadius: DEFAULT_SPAWN_SAFE_RADIUS,
    ringThickness: DEFAULT_SPAWN_RING_THICKNESS,
    nextSpawnAtSeconds: new Float32Array(wave?.spawnEntries.length ?? 0),
    activeCountsByType: new Uint16Array(0)
  };
}
function ensureSpawnDirector(world) {
  const defaultWave = getDefaultEnemyWave(world.content);
  let director = world.scratch.enemySpawnDirector;
  if (!director) {
    director = createSpawnDirectorState(defaultWave);
    world.scratch.enemySpawnDirector = director;
  }
  if (defaultWave && (director.waveContentIndex !== defaultWave.contentIndex || director.nextSpawnAtSeconds.length !== defaultWave.spawnEntries.length)) {
    director.waveContentIndex = defaultWave.contentIndex;
    director.nextSpawnAtSeconds = new Float32Array(defaultWave.spawnEntries.length);
    director.initialized = false;
  }
  return director;
}
function initializeSpawnTimes(director, wave) {
  for (let entryIndex = 0; entryIndex < wave.spawnEntries.length; entryIndex += 1) {
    director.nextSpawnAtSeconds[entryIndex] = wave.spawnEntries[entryIndex].startSeconds;
  }
  director.initialized = true;
}
function ensureActiveCountBuffer(director, requiredSize) {
  if (director.activeCountsByType.length < requiredSize) {
    director.activeCountsByType = new Uint16Array(requiredSize);
  } else {
    director.activeCountsByType.fill(0);
  }
  return director.activeCountsByType;
}
function countActiveEnemiesByArchetype(world, requiredSize) {
  const director = ensureSpawnDirector(world);
  const counts = ensureActiveCountBuffer(director, requiredSize);
  const store = ensureEnemyStore(world);
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    const archetypeIndex = store.typeIds[slot];
    if (archetypeIndex < counts.length) {
      counts[archetypeIndex] += 1;
    }
  }
  return counts;
}
function sampleOffscreenSpawnPoint(world, safeRadius, ringThickness) {
  const player = world.stores.player;
  const centerX = player.exists ? player.posX : 0;
  const centerY = player.exists ? player.posY : 0;
  const radius = safeRadius + world.rng.next() * ringThickness;
  const angle = world.rng.next() * Math.PI * 2;
  const spawnBounds = world.config.bounds?.spawn ?? DEFAULT_SIM_BOUNDS.spawn;
  const playerBounds = world.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player;
  const edgeBounds = {
    minX: Math.max(spawnBounds.minX, playerBounds.minX - DEFAULT_EDGE_SPAWN_MARGIN),
    maxX: Math.min(spawnBounds.maxX, playerBounds.maxX + DEFAULT_EDGE_SPAWN_MARGIN),
    minY: Math.max(spawnBounds.minY, playerBounds.minY - DEFAULT_EDGE_SPAWN_MARGIN),
    maxY: Math.min(spawnBounds.maxY, playerBounds.maxY + DEFAULT_EDGE_SPAWN_MARGIN)
  };
  return {
    x: Math.max(edgeBounds.minX, Math.min(edgeBounds.maxX, centerX + Math.cos(angle) * radius)),
    y: Math.max(edgeBounds.minY, Math.min(edgeBounds.maxY, centerY + Math.sin(angle) * radius))
  };
}
function stepSpawnDirector(world, elapsedSeconds) {
  const wave = getDefaultEnemyWave(world.content);
  if (!wave) {
    return;
  }
  const director = ensureSpawnDirector(world);
  if (!director.initialized || world.time.tick <= 1) {
    initializeSpawnTimes(director, wave);
  }
  const store = ensureEnemyStore(world);
  if (store.activeCount >= director.maxActiveEnemies) {
    return;
  }
  const runtimeContent = getEnemyRuntimeContent(world.content);
  const activeCounts = countActiveEnemiesByArchetype(
    world,
    runtimeContent?.archetypes.length ?? wave.spawnEntries.length
  );
  const spawnCapacityRemaining = director.maxActiveEnemies - store.activeCount;
  let queuedThisTick = 0;
  for (let entryIndex = 0; entryIndex < wave.spawnEntries.length; entryIndex += 1) {
    const entry = wave.spawnEntries[entryIndex];
    if (elapsedSeconds < entry.startSeconds || elapsedSeconds > entry.endSeconds) {
      continue;
    }
    while (elapsedSeconds >= director.nextSpawnAtSeconds[entryIndex] && queuedThisTick < spawnCapacityRemaining && activeCounts[entry.enemyIndex] < entry.maxConcurrent) {
      const remainingByArchetype = entry.maxConcurrent - activeCounts[entry.enemyIndex];
      const remainingGlobal = spawnCapacityRemaining - queuedThisTick;
      const batchCount = Math.min(entry.batchSize, remainingByArchetype, remainingGlobal);
      for (let count = 0; count < batchCount; count += 1) {
        const spawnPoint = sampleOffscreenSpawnPoint(
          world,
          director.safeRadius,
          director.ringThickness
        );
        world.commands.enemySpawn.enqueue(entry.enemyIndex, spawnPoint.x, spawnPoint.y);
        queuedThisTick += 1;
        activeCounts[entry.enemyIndex] += 1;
      }
      director.nextSpawnAtSeconds[entryIndex] += entry.intervalSeconds;
      if (batchCount === 0) {
        break;
      }
    }
  }
}

// src/sim/enemies/SpawnDirectorSystem.ts
function stepSpawnDirectorSystem(context) {
  stepSpawnDirector(context.world, context.elapsedSeconds);
}

// src/sim/projectiles/ProjectileLifecycle.ts
function releaseProjectile(store, slot) {
  return store.release(slot);
}

// src/sim/projectiles/ProjectileHitQuerySystem.ts
function queryProjectileHits(context) {
  const projectiles = ensureProjectileStore(context.world);
  const enemies = ensureEnemyStore(context.world);
  const spatialGrid = ensureSpatialGrid(context.world);
  let projectileDenseIndex = 0;
  while (projectileDenseIndex < projectiles.activeCount) {
    const projectileSlot = projectiles.activeSlots[projectileDenseIndex];
    const projectileX = projectiles.posX[projectileSlot];
    const projectileY = projectiles.posY[projectileSlot];
    const projectileRadius = projectiles.radius[projectileSlot];
    const projectileDamage = projectiles.damage[projectileSlot];
    let remainingPierce = projectiles.remainingPierce[projectileSlot];
    let shouldDespawn = false;
    const minCellX = cellCoord(projectileX - projectileRadius, spatialGrid.cellSize);
    const maxCellX = cellCoord(projectileX + projectileRadius, spatialGrid.cellSize);
    const minCellY = cellCoord(projectileY - projectileRadius, spatialGrid.cellSize);
    const maxCellY = cellCoord(projectileY + projectileRadius, spatialGrid.cellSize);
    for (let cellYIndex = minCellY; cellYIndex <= maxCellY && !shouldDespawn; cellYIndex += 1) {
      for (let cellXIndex = minCellX; cellXIndex <= maxCellX && !shouldDespawn; cellXIndex += 1) {
        const bucket = spatialGrid.buckets.get(createCellKey(cellXIndex, cellYIndex));
        if (!bucket) {
          continue;
        }
        for (let bucketIndex = 0; bucketIndex < bucket.length && !shouldDespawn; bucketIndex += 1) {
          const enemySlot = bucket[bucketIndex];
          if (!enemies.isAlive(enemySlot)) {
            continue;
          }
          if (!circlesOverlap(
            projectileX,
            projectileY,
            projectileRadius,
            enemies.posX[enemySlot],
            enemies.posY[enemySlot],
            enemies.radius[enemySlot]
          )) {
            continue;
          }
          context.world.commands.damage.enqueue("enemy", enemySlot, projectileDamage, "projectile", projectileSlot);
          if (remainingPierce > 0) {
            remainingPierce -= 1;
            continue;
          }
          shouldDespawn = true;
        }
      }
    }
    if (shouldDespawn) {
      releaseProjectile(projectiles, projectileSlot);
      continue;
    }
    projectiles.remainingPierce[projectileSlot] = remainingPierce;
    projectileDenseIndex += 1;
  }
}

// src/sim/projectiles/ProjectileMovementSystem.ts
function stepProjectileMovement(context) {
  const store = ensureProjectileStore(context.world);
  let denseIndex = 0;
  while (denseIndex < store.activeCount) {
    const slot = store.activeSlots[denseIndex];
    store.posX[slot] += store.velX[slot] * context.dt;
    store.posY[slot] += store.velY[slot] * context.dt;
    store.remainingLife[slot] -= context.dt;
    if (store.remainingLife[slot] <= 0) {
      releaseProjectile(store, slot);
      continue;
    }
    denseIndex += 1;
  }
}

// src/sim/projectiles/ProjectileSpawnSystem.ts
function spawnProjectilesFromCommands(context) {
  const store = ensureProjectileStore(context.world);
  const commands = context.world.commands.projectileSpawn;
  const commandCount = commands.count;
  for (let index = 0; index < commandCount; index += 1) {
    const command = commands.get(index);
    const slot = store.allocate();
    store.typeIds[slot] = command.projectileTypeId;
    store.ownerTeam[slot] = command.ownerTeam;
    store.posX[slot] = command.x;
    store.posY[slot] = command.y;
    store.velX[slot] = command.velX;
    store.velY[slot] = command.velY;
    store.radius[slot] = command.radius;
    store.damage[slot] = command.damage;
    store.remainingLife[slot] = command.remainingLife;
    store.remainingPierce[slot] = command.remainingPierce;
    store.flags[slot] = command.flags;
  }
  commands.clear();
}

// src/sim/pickups/PickupSpawnSystem.ts
function applyPickupSpawnCommands(context) {
  const { world } = context;
  const store = ensurePickupStore(world);
  const commandCount = world.commands.pickupSpawn.count;
  for (let commandIndex = 0; commandIndex < commandCount; commandIndex += 1) {
    const command = world.commands.pickupSpawn.get(commandIndex);
    const pickupDef = getPickupDefByIndex(world.content, command.pickupTypeId);
    if (!pickupDef) {
      continue;
    }
    const slot = store.allocate();
    store.typeIds[slot] = command.pickupTypeId;
    store.posX[slot] = command.x;
    store.posY[slot] = command.y;
    store.velX[slot] = 0;
    store.velY[slot] = 0;
    store.radius[slot] = command.radius > 0 ? command.radius : pickupDef.radius;
    store.value[slot] = command.value > 0 ? command.value : pickupDef.defaultValue;
    store.magnetized[slot] = 0;
    store.magnetTimeRemaining[slot] = 0;
    store.magnetSpeed[slot] = pickupDef.magnetSpeed;
  }
  world.commands.pickupSpawn.clear();
}

// src/sim/pickups/HealthPickupSpawnSystem.ts
var HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS = 18;
var MAX_ACTIVE_HEALTH_PICKUPS = 2;
var healthPickupIndexCache = /* @__PURE__ */ new WeakMap();
function isPickupRegistry(content) {
  const registry = content;
  return typeof content === "object" && content !== null && !!registry.pickups && Array.isArray(registry.pickups.defs);
}
function getHealPickupIndex(content) {
  if (!isPickupRegistry(content)) {
    return -1;
  }
  const cacheKey = content;
  const cached = healthPickupIndexCache.get(cacheKey);
  if (cached !== void 0) {
    return cached;
  }
  let foundIndex = -1;
  for (let index = 0; index < content.pickups.defs.length; index += 1) {
    if (content.pickups.defs[index].grantKind === "heal") {
      foundIndex = index;
      break;
    }
  }
  healthPickupIndexCache.set(cacheKey, foundIndex);
  return foundIndex;
}
function countActiveHealPickups(context, healPickupIndex) {
  let count = 0;
  const store = ensurePickupStore(context.world);
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    if (store.typeIds[slot] === healPickupIndex) {
      count += 1;
    }
  }
  return count;
}
function stepHealthPickupSpawner(context) {
  const { world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }
  if (world.time.elapsedSeconds < world.scratch.nextHealthPickupSpawnAtSeconds) {
    return;
  }
  const healPickupIndex = getHealPickupIndex(world.content);
  if (healPickupIndex < 0 || !isPickupRegistry(world.content)) {
    world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
    return;
  }
  if (countActiveHealPickups(context, healPickupIndex) >= MAX_ACTIVE_HEALTH_PICKUPS) {
    world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
    return;
  }
  const pickupDef = world.content.pickups.defs[healPickupIndex];
  if (!pickupDef) {
    world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
    return;
  }
  const bounds = world.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player;
  const x = bounds.minX + world.rng.next() * (bounds.maxX - bounds.minX);
  const y = bounds.minY + world.rng.next() * (bounds.maxY - bounds.minY);
  world.commands.pickupSpawn.enqueue(healPickupIndex, x, y, pickupDef.radius, pickupDef.defaultValue);
  world.scratch.nextHealthPickupSpawnAtSeconds += HEALTH_PICKUP_SPAWN_INTERVAL_SECONDS;
}

// src/sim/pickups/MagnetPickupSpawnSystem.ts
var MAGNET_PICKUP_SPAWN_INTERVAL_SECONDS = 24;
var MAGNET_PICKUP_SPAWN_CHANCE = 0.38;
var MAX_ACTIVE_MAGNET_PICKUPS = 1;
var magnetPickupIndexCache = /* @__PURE__ */ new WeakMap();
function isPickupRegistry2(content) {
  const registry = content;
  return typeof content === "object" && content !== null && !!registry.pickups && Array.isArray(registry.pickups.defs);
}
function getMagnetPickupIndex(content) {
  if (!isPickupRegistry2(content)) {
    return -1;
  }
  const cacheKey = content;
  const cached = magnetPickupIndexCache.get(cacheKey);
  if (cached !== void 0) {
    return cached;
  }
  let foundIndex = -1;
  for (let index = 0; index < content.pickups.defs.length; index += 1) {
    if (content.pickups.defs[index].grantKind === "magnet") {
      foundIndex = index;
      break;
    }
  }
  magnetPickupIndexCache.set(cacheKey, foundIndex);
  return foundIndex;
}
function countActiveMagnetPickups(context, magnetPickupIndex) {
  let count = 0;
  const store = ensurePickupStore(context.world);
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    if (store.typeIds[slot] === magnetPickupIndex) {
      count += 1;
    }
  }
  return count;
}
function stepMagnetPickupSpawner(context) {
  const { world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }
  if (world.time.elapsedSeconds < world.scratch.nextMagnetPickupSpawnAtSeconds) {
    return;
  }
  world.scratch.nextMagnetPickupSpawnAtSeconds += MAGNET_PICKUP_SPAWN_INTERVAL_SECONDS;
  const magnetPickupIndex = getMagnetPickupIndex(world.content);
  if (magnetPickupIndex < 0 || !isPickupRegistry2(world.content)) {
    return;
  }
  if (countActiveMagnetPickups(context, magnetPickupIndex) >= MAX_ACTIVE_MAGNET_PICKUPS) {
    return;
  }
  if (world.rng.next() > MAGNET_PICKUP_SPAWN_CHANCE) {
    return;
  }
  const pickupDef = world.content.pickups.defs[magnetPickupIndex];
  if (!pickupDef) {
    return;
  }
  const bounds = world.config.bounds?.player ?? DEFAULT_SIM_BOUNDS.player;
  const x = bounds.minX + world.rng.next() * (bounds.maxX - bounds.minX);
  const y = bounds.minY + world.rng.next() * (bounds.maxY - bounds.minY);
  world.commands.pickupSpawn.enqueue(magnetPickupIndex, x, y, pickupDef.radius, pickupDef.defaultValue);
}

// src/sim/pickups/PickupMagnetSystem.ts
var PICKUP_MAGNET_DURATION_SECONDS = 0.25;
function stepPickupMagnetSystem(context) {
  const { dt, world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }
  const store = ensurePickupStore(world);
  const magnetRadius = Math.max(0, player.pickupRadius);
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    const dx = player.posX - store.posX[slot];
    const dy = player.posY - store.posY[slot];
    const distanceSq = dx * dx + dy * dy;
    if (!store.magnetized[slot]) {
      if (distanceSq > magnetRadius * magnetRadius) {
        continue;
      }
      store.magnetized[slot] = 1;
      store.magnetTimeRemaining[slot] = PICKUP_MAGNET_DURATION_SECONDS;
    }
    const distance = Math.sqrt(distanceSq);
    if (distance <= 1e-4) {
      store.velX[slot] = 0;
      store.velY[slot] = 0;
      store.posX[slot] = player.posX;
      store.posY[slot] = player.posY;
      store.magnetTimeRemaining[slot] = 0;
      continue;
    }
    const remaining = Math.max(dt, store.magnetTimeRemaining[slot]);
    const alpha = Math.min(1, dt / remaining);
    const nextX = store.posX[slot] + dx * alpha;
    const nextY = store.posY[slot] + dy * alpha;
    store.velX[slot] = (nextX - store.posX[slot]) / dt;
    store.velY[slot] = (nextY - store.posY[slot]) / dt;
    store.posX[slot] = nextX;
    store.posY[slot] = nextY;
    store.magnetTimeRemaining[slot] = Math.max(0, remaining - dt);
  }
}

// src/sim/pickups/PickupCollectSystem.ts
function magnetizeAllXpPickups(context) {
  const store = ensurePickupStore(context.world);
  for (let denseIndex = 0; denseIndex < store.activeCount; denseIndex += 1) {
    const slot = store.activeSlots[denseIndex];
    const pickupDef = getPickupDefByIndex(context.world.content, store.typeIds[slot]);
    if (pickupDef?.grantKind !== "xp") {
      continue;
    }
    store.magnetized[slot] = 1;
    store.magnetTimeRemaining[slot] = PICKUP_MAGNET_DURATION_SECONDS;
  }
}
function stepPickupCollectSystem(context) {
  const { world } = context;
  const player = world.stores.player;
  if (!player.exists || player.isDead) {
    return;
  }
  const store = ensurePickupStore(world);
  let denseIndex = 0;
  while (denseIndex < store.activeCount) {
    const slot = store.activeSlots[denseIndex];
    const dx = player.posX - store.posX[slot];
    const dy = player.posY - store.posY[slot];
    const radius = player.radius + store.radius[slot];
    if (dx * dx + dy * dy > radius * radius) {
      denseIndex += 1;
      continue;
    }
    const value = store.value[slot];
    const pickupDef = getPickupDefByIndex(world.content, store.typeIds[slot]);
    if (value > 0 && pickupDef?.grantKind === "xp") {
      world.commands.xpGrant.enqueue(value);
    } else if (value > 0 && pickupDef?.grantKind === "heal") {
      if (player.hp >= player.maxHp) {
        denseIndex += 1;
        continue;
      }
      player.hp = Math.min(player.maxHp, player.hp + value);
    } else if (pickupDef?.grantKind === "magnet") {
      magnetizeAllXpPickups(context);
    }
    store.release(slot);
  }
}

// src/sim/progression/ProgressionSystem.ts
function grantXp(store, amount) {
  if (amount <= 0) {
    return;
  }
  store.xp += amount;
}
function consumeXpGrantCommands(context) {
  const progression = ensureProgressionStore(context.world);
  for (let index = 0; index < context.world.commands.xpGrant.count; index += 1) {
    const command = context.world.commands.xpGrant.get(index);
    grantXp(progression, command.amount);
  }
  context.world.commands.xpGrant.clear();
}
function updateThresholdsAndQueue(context) {
  const progression = ensureProgressionStore(context.world);
  const curveInfo = resolveActiveProgressionCurve(context.world.content);
  progression.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, progression.level);
  while (progression.xp >= progression.xpToNext && progression.xpToNext > 0) {
    progression.xp -= progression.xpToNext;
    progression.level += 1;
    progression.queuedLevelUps += 1;
    progression.xpToNext = getXpThresholdForLevel(curveInfo?.curve ?? null, progression.level);
  }
}
function queueLevelUpState(context) {
  const progression = ensureProgressionStore(context.world);
  if (progression.queuedLevelUps <= 0) {
    return;
  }
  ensureLevelUpChoices(context.world);
  if (context.world.runState.current !== RunState.LevelUpChoice) {
    context.world.commands.stateChange.enqueue(RunState.LevelUpChoice, "levelup-threshold-crossed");
  }
}
function stepProgression(context) {
  ensureProgressionStore(context.world);
  consumeXpGrantCommands(context);
  updateThresholdsAndQueue(context);
  queueLevelUpState(context);
}

// src/sim/spatial/SpatialGridBuildSystem.ts
function rebuildSpatialGrid(context) {
  ensureSpatialGrid(context.world).rebuildEnemyOccupancy(context.world);
}

// src/sim/debug/DebugCommands.ts
function extractDebugCommandFrame(input) {
  return {
    grantXp: input.debugGrantXpPressed ?? false,
    spawnWave: input.debugSpawnWavePressed ?? false,
    toggleInvulnerable: input.debugToggleInvulnerablePressed ?? false
  };
}

// src/sim/core/systems/InputApplySystem.ts
var DEBUG_SPAWN_BATCH_COUNT = 10;
function inputApplySystem(context) {
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
    const director = ensureSpawnDirector(world);
    const runtimeContent = getEnemyRuntimeContent(world.content);
    const archetypeCount = runtimeContent?.archetypes.length ?? 0;
    for (let count = 0; count < DEBUG_SPAWN_BATCH_COUNT; count += 1) {
      const spawn = sampleOffscreenSpawnPoint(world, director.safeRadius, director.ringThickness);
      const archetypeIndex = archetypeCount > 0 ? Math.floor(world.rng.next() * archetypeCount) % archetypeCount : 0;
      world.commands.enemySpawn.enqueue(archetypeIndex, spawn.x, spawn.y);
    }
  }
  if (frameInput.debugToggleInvulnerablePressed) {
    world.stores.player.debugInvulnerable = !world.stores.player.debugInvulnerable;
    if (world.stores.player.debugInvulnerable) {
      world.stores.player.invulnRemaining = 0;
    }
  }
}

// src/sim/core/systems/RunStateSystem.ts
function runStateSystem(context) {
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

// src/sim/core/systems/SystemRegistry.ts
var NO_OP_SYSTEMS = /* @__PURE__ */ new Set([
  "DeathAndDropSystem",
  "CleanupSystem",
  "RenderExtractSystem"
]);
var GAMEPLAY_EXECUTORS = {
  SpawnDirectorSystem: stepSpawnDirectorSystem,
  ApplySpawnCommandsSystem: applyEnemySpawnCommands,
  PlayerMovementSystem: stepPlayerMovement,
  PreMovementSpatialGridBuildSystem: rebuildSpatialGrid,
  EnemyMovementSystem: stepEnemyMovement,
  WeaponFireSystem: stepWeaponFire,
  ApplyProjectileSpawnCommandsSystem: spawnProjectilesFromCommands,
  ProjectileMovementSystem: stepProjectileMovement,
  SpatialGridBuildSystem: rebuildSpatialGrid,
  ContactDamageQuerySystem: queryContactDamage,
  ProjectileHitQuerySystem: queryProjectileHits,
  DamageResolveSystem: resolveDamage,
  PickupMagnetSystem: stepPickupMagnetSystem,
  PickupCollectSystem: stepPickupCollectSystem,
  ProgressionSystem: stepProgression
};
function resolvePhase(name) {
  return name === "RunStateSystem" || name === "InputApplySystem" || name === "RenderExtractSystem" ? "always" : "gameplay";
}
function resolveExecutor(name) {
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
        return () => {
        };
      }
      return () => {
      };
    }
  }
}
function createSystemPipeline() {
  return SYSTEM_ORDER.map((name) => ({
    name,
    phase: resolvePhase(name),
    execute: resolveExecutor(name)
  }));
}

// src/sim/core/Sim.ts
function createFrameContext(world, config, frameInput) {
  return {
    dt: config.fixedStepSeconds,
    tick: world.time.tick,
    elapsedSeconds: world.time.elapsedSeconds,
    frameInput,
    config,
    world
  };
}
var Sim = class {
  config;
  get fixedStepSeconds() {
    return this.config.fixedStepSeconds;
  }
  content;
  pipeline;
  worldFactory;
  accumulatorSeconds = 0;
  seed;
  world;
  constructor(config = {}, content = {}, seed = 1) {
    this.config = mergeSimConfig(config);
    this.content = content;
    this.seed = seed >>> 0;
    this.pipeline = createSystemPipeline();
    this.worldFactory = createWorldFactory(this.config, this.content);
    this.world = this.worldFactory(this.seed, this.config.initialRunState);
  }
  step(frameSeconds, inputFrame = EMPTY_SIM_INPUT) {
    const clampedFrameSeconds = Math.max(0, Math.min(frameSeconds, this.config.maxFrameSeconds));
    this.accumulatorSeconds += clampedFrameSeconds;
    let stepsExecuted = 0;
    while (this.accumulatorSeconds >= this.config.fixedStepSeconds && stepsExecuted < this.config.maxSubstepsPerFrame) {
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
  resetRun(seed = this.seed) {
    this.seed = seed >>> 0;
    this.accumulatorSeconds = 0;
    resetWorld(this.world, this.seed, RunState.StartingRun);
  }
  setRunState(nextState) {
    applyRunState(this.world, nextState, "api");
  }
  getRenderSnapshot() {
    return extractRenderSnapshot(this.world);
  }
  getFixedStepSeconds() {
    return this.config.fixedStepSeconds;
  }
  getLevelUpPayload() {
    return getLevelUpPayload(this.world);
  }
  ensureLevelUpPayload() {
    return ensureLevelUpChoices(this.world);
  }
  selectUpgrade(choiceIndex) {
    return selectUpgrade(this.world, choiceIndex);
  }
  getDebugSnapshot() {
    const counters = {
      activeEnemies: this.world.stores.enemies.activeCount,
      activeProjectiles: this.world.stores.projectiles.activeCount,
      activePickups: this.world.stores.pickups.activeCount,
      damageRequestsProcessed: this.world.commands.damage.count,
      spawnCommandsProcessed: this.world.commands.enemySpawn.count + this.world.commands.projectileSpawn.count + this.world.commands.pickupSpawn.count,
      ticksStepped: this.world.debug.tick,
      elapsedSeconds: this.world.time.elapsedSeconds,
      lastFrameSeconds: this.world.debug.lastFrameSubsteps * this.config.fixedStepSeconds
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
        stateChange: this.world.commands.stateChange.count
      },
      systems: Object.fromEntries(
        Object.entries(this.world.debug.systemCounters).map(([name, counter]) => [
          name,
          {
            executedTicks: counter.executedTicks,
            skippedTicks: counter.skippedTicks
          }
        ])
      )
    };
  }
  executeTick(inputFrame) {
    const advancesSimulation = isSimulationAdvancingState(this.world.runState.current);
    this.world.time.tick += 1;
    if (advancesSimulation) {
      this.world.time.elapsedSeconds += this.config.fixedStepSeconds;
    }
    this.world.debug.tick = this.world.time.tick;
    const context = createFrameContext(this.world, this.config, inputFrame);
    for (const system of this.pipeline) {
      const counter = this.world.debug.systemCounters[system.name];
      if (system.phase === "gameplay" && !advancesSimulation) {
        counter.skippedTicks += 1;
        continue;
      }
      counter.executedTicks += 1;
      system.execute(context);
    }
    if (advancesSimulation) {
      this.world.debug.gameplayTicks += 1;
    }
    this.world.debug.estimatedStepSeconds = this.world.debug.gameplayTicks * this.config.fixedStepSeconds;
  }
};
function createSim(config = {}, content = {}, seed = 1) {
  return new Sim(config, content, seed);
}

// src/sim/content/ContentRegistry.ts
var ContentTableImpl = class {
  ids;
  defs;
  byId;
  indexById;
  constructor(defs) {
    this.defs = defs;
    this.ids = defs.map((def) => def.id);
    this.byId = new Map(defs.map((def) => [def.id, def]));
    this.indexById = new Map(this.ids.map((id, index) => [id, index]));
  }
  get(id) {
    const def = this.byId.get(id);
    if (!def) {
      throw new Error(`Unknown content ID "${id}".`);
    }
    return def;
  }
  getIndex(id) {
    const index = this.indexById.get(id);
    if (index === void 0) {
      throw new Error(`Unknown content ID "${id}".`);
    }
    return index;
  }
  has(id) {
    return this.byId.has(id);
  }
};
function createContentRegistry(bundle) {
  return {
    playerCharacters: new ContentTableImpl(bundle.playerCharacters),
    enemyArchetypes: new ContentTableImpl(bundle.enemyArchetypes),
    weapons: new ContentTableImpl(bundle.weapons),
    projectiles: new ContentTableImpl(bundle.projectiles),
    passiveUpgrades: new ContentTableImpl(bundle.passiveUpgrades),
    pickups: new ContentTableImpl(bundle.pickups),
    progressionCurves: new ContentTableImpl(bundle.progressionCurves),
    waves: new ContentTableImpl(bundle.waves),
    bundle
  };
}

// src/sim/content/ContentIds.ts
function makeContentId(expectedPrefix, rawId) {
  if (!rawId.startsWith(`${expectedPrefix}.`)) {
    throw new Error(
      `Content ID "${rawId}" must use the "${expectedPrefix}." prefix.`
    );
  }
  return rawId;
}
function playerCharacterId(rawId) {
  return makeContentId("player", rawId);
}
function enemyArchetypeId(rawId) {
  return makeContentId("enemy", rawId);
}
function weaponId(rawId) {
  return makeContentId("weapon", rawId);
}
function projectileId(rawId) {
  return makeContentId("projectile", rawId);
}
function passiveUpgradeId(rawId) {
  return makeContentId("passive", rawId);
}
function pickupId(rawId) {
  return makeContentId("pickup", rawId);
}
function progressionCurveId(rawId) {
  return makeContentId("progression", rawId);
}
function waveId(rawId) {
  return makeContentId("wave", rawId);
}

// src/sim/content/defs/prototypeEnemies.ts
var prototypeEnemyArchetypes = [
  {
    id: enemyArchetypeId("enemy.bat"),
    displayName: "Bat",
    spriteKey: "enemy_bat",
    behavior: "chase",
    maxHp: 10,
    moveSpeed: 62,
    radius: 10,
    contactDamage: 8,
    xpValue: 1,
    collisionFlags: 1
  },
  {
    id: enemyArchetypeId("enemy.skeleton"),
    displayName: "Skeleton",
    spriteKey: "enemy_skeleton",
    behavior: "chase",
    maxHp: 24,
    moveSpeed: 42,
    radius: 14,
    contactDamage: 12,
    xpValue: 2,
    collisionFlags: 1
  },
  {
    id: enemyArchetypeId("enemy.ghost"),
    displayName: "Ghost",
    spriteKey: "enemy_ghost",
    behavior: "chase",
    maxHp: 18,
    moveSpeed: 52,
    radius: 13,
    contactDamage: 10,
    xpValue: 3,
    collisionFlags: 1
  },
  {
    id: enemyArchetypeId("enemy.miniboss_executioner"),
    displayName: "Executioner",
    spriteKey: "enemy_miniboss_executioner",
    behavior: "chase",
    maxHp: 220,
    moveSpeed: 34,
    radius: 24,
    contactDamage: 22,
    xpValue: 12,
    collisionFlags: 1
  },
  {
    id: enemyArchetypeId("enemy.boss_lich"),
    displayName: "Lich King",
    spriteKey: "enemy_boss_lich",
    behavior: "chase",
    maxHp: 520,
    moveSpeed: 28,
    radius: 30,
    contactDamage: 30,
    xpValue: 24,
    collisionFlags: 1
  }
];

// src/sim/content/defs/prototypePassives.ts
var prototypePassiveUpgrades = [
  {
    id: passiveUpgradeId("passive.spinach"),
    displayName: "Spinach",
    description: "Increases outgoing damage.",
    iconKey: "passive_spinach",
    maxLevel: 5,
    modifiersByLevel: [
      [{ stat: "might", mode: "add", value: 0.1 }],
      [{ stat: "might", mode: "add", value: 0.1 }],
      [{ stat: "might", mode: "add", value: 0.1 }],
      [{ stat: "might", mode: "add", value: 0.1 }],
      [{ stat: "might", mode: "add", value: 0.1 }]
    ]
  },
  {
    id: passiveUpgradeId("passive.bracers"),
    displayName: "Bracers",
    description: "Expands attack area.",
    iconKey: "passive_bracers",
    maxLevel: 5,
    modifiersByLevel: [
      [{ stat: "areaMultiplier", mode: "add", value: 0.1 }],
      [{ stat: "areaMultiplier", mode: "add", value: 0.1 }],
      [{ stat: "areaMultiplier", mode: "add", value: 0.1 }],
      [{ stat: "areaMultiplier", mode: "add", value: 0.1 }],
      [{ stat: "areaMultiplier", mode: "add", value: 0.1 }]
    ]
  },
  {
    id: passiveUpgradeId("passive.tome"),
    displayName: "Tome",
    description: "Reduces weapon cooldowns.",
    iconKey: "passive_tome",
    maxLevel: 5,
    modifiersByLevel: [
      [{ stat: "cooldownMultiplier", mode: "mul", value: 0.92 }],
      [{ stat: "cooldownMultiplier", mode: "mul", value: 0.92 }],
      [{ stat: "cooldownMultiplier", mode: "mul", value: 0.92 }],
      [{ stat: "cooldownMultiplier", mode: "mul", value: 0.92 }],
      [{ stat: "cooldownMultiplier", mode: "mul", value: 0.92 }]
    ]
  },
  {
    id: passiveUpgradeId("passive.wings"),
    displayName: "Wings",
    description: "Increases movement speed.",
    iconKey: "passive_wings",
    maxLevel: 5,
    modifiersByLevel: [
      [{ stat: "moveSpeed", mode: "add", value: 12 }],
      [{ stat: "moveSpeed", mode: "add", value: 12 }],
      [{ stat: "moveSpeed", mode: "add", value: 12 }],
      [{ stat: "moveSpeed", mode: "add", value: 12 }],
      [{ stat: "moveSpeed", mode: "add", value: 12 }]
    ]
  },
  {
    id: passiveUpgradeId("passive.crown"),
    displayName: "Crown",
    description: "Improves experience pickup reach.",
    iconKey: "passive_crown",
    maxLevel: 5,
    modifiersByLevel: [
      [{ stat: "pickupRadius", mode: "add", value: 24 }],
      [{ stat: "pickupRadius", mode: "add", value: 24 }],
      [{ stat: "pickupRadius", mode: "add", value: 24 }],
      [{ stat: "pickupRadius", mode: "add", value: 24 }],
      [{ stat: "pickupRadius", mode: "add", value: 24 }]
    ]
  },
  {
    id: passiveUpgradeId("passive.armor_plate"),
    displayName: "Armor Plate",
    description: "Reduces incoming contact damage.",
    iconKey: "passive_armor_plate",
    maxLevel: 5,
    modifiersByLevel: [
      [{ stat: "armor", mode: "add", value: 1 }],
      [{ stat: "armor", mode: "add", value: 1 }],
      [{ stat: "armor", mode: "add", value: 1 }],
      [{ stat: "armor", mode: "add", value: 1 }],
      [{ stat: "armor", mode: "add", value: 1 }]
    ]
  }
];

// src/sim/content/defs/prototypePickups.ts
var prototypePickups = [
  {
    id: pickupId("pickup.xp_small"),
    displayName: "Small XP Gem",
    spriteKey: "pickup_xp_small",
    radius: 8,
    magnetSpeed: 220,
    grantKind: "xp",
    defaultValue: 1
  },
  {
    id: pickupId("pickup.xp_medium"),
    displayName: "Large XP Crystal",
    spriteKey: "pickup_xp_medium",
    radius: 10,
    magnetSpeed: 220,
    grantKind: "xp",
    defaultValue: 8
  },
  {
    id: pickupId("pickup.xp_large"),
    displayName: "Boss XP Crystal",
    spriteKey: "pickup_xp_large",
    radius: 12,
    magnetSpeed: 220,
    grantKind: "xp",
    defaultValue: 24
  },
  {
    id: pickupId("pickup.heal_small"),
    displayName: "Small Health Orb",
    spriteKey: "pickup_xp_small",
    radius: 10,
    magnetSpeed: 220,
    grantKind: "heal",
    defaultValue: 12
  },
  {
    id: pickupId("pickup.magnet_small"),
    displayName: "Vacuum Magnet",
    spriteKey: "pickup_magnet_blue",
    radius: 12,
    magnetSpeed: 0,
    grantKind: "magnet",
    defaultValue: 0
  }
];

// src/sim/content/defs/prototypePlayers.ts
var prototypePlayerCharacters = [
  {
    id: playerCharacterId("player.witch"),
    displayName: "Witch",
    description: "Balanced starter character built around ranged spell fire.",
    spriteKey: "player_witch",
    baseStats: {
      maxHp: 100,
      moveSpeed: 160,
      radius: 12,
      pickupRadius: 96,
      armor: 0,
      might: 1,
      cooldownMultiplier: 1,
      durationMultiplier: 1,
      areaMultiplier: 1,
      projectileCount: 1,
      luck: 0
    },
    starterWeaponIds: [weaponId("weapon.magic_bolt")]
  }
];

// src/sim/content/defs/prototypeProgression.ts
var prototypeProgressionCurves = [
  {
    id: progressionCurveId("progression.prototype"),
    displayName: "Prototype Progression",
    levelXpThresholds: [5, 12, 20, 30, 42, 56, 72, 90, 110, 132]
  }
];

// src/sim/content/defs/prototypeProjectiles.ts
var prototypeProjectiles = [
  {
    id: projectileId("projectile.magic_bolt"),
    displayName: "Magic Bolt",
    spriteKey: "projectile_magic_bolt",
    radius: 6,
    speed: 520,
    baseDamage: 12,
    lifetimeSeconds: 1.4,
    maxPierce: 0,
    collisionFlags: 1
  }
];

// src/sim/content/defs/prototypeWaves.ts
var prototypeWaves = [
  {
    id: waveId("wave.prototype_field"),
    displayName: "Prototype Field",
    progressionCurveId: progressionCurveId("progression.prototype"),
    spawnEntries: [
      {
        enemyId: enemyArchetypeId("enemy.bat"),
        startSeconds: 0,
        endSeconds: 600,
        intervalSeconds: 2.75,
        batchSize: 4,
        weight: 3,
        maxConcurrent: 20
      },
      {
        enemyId: enemyArchetypeId("enemy.skeleton"),
        startSeconds: 20,
        endSeconds: 600,
        intervalSeconds: 4.5,
        batchSize: 3,
        weight: 2,
        maxConcurrent: 16
      },
      {
        enemyId: enemyArchetypeId("enemy.ghost"),
        startSeconds: 40,
        endSeconds: 600,
        intervalSeconds: 5.5,
        batchSize: 2,
        weight: 1,
        maxConcurrent: 10
      },
      {
        enemyId: enemyArchetypeId("enemy.miniboss_executioner"),
        startSeconds: 75,
        endSeconds: 600,
        intervalSeconds: 45,
        batchSize: 1,
        weight: 0.4,
        maxConcurrent: 2
      },
      {
        enemyId: enemyArchetypeId("enemy.boss_lich"),
        startSeconds: 180,
        endSeconds: 600,
        intervalSeconds: 120,
        batchSize: 1,
        weight: 0.15,
        maxConcurrent: 1
      }
    ]
  }
];

// src/sim/content/defs/prototypeWeapons.ts
var prototypeWeapons = [
  {
    id: weaponId("weapon.magic_bolt"),
    displayName: "Magic Bolt",
    description: "Auto-fires a fast projectile at the nearest enemy.",
    iconKey: "weapon_magic_bolt",
    behavior: "projectile",
    maxLevel: 8,
    baseCooldownSeconds: 0.9,
    shotsPerFire: 1,
    targeting: "nearest_enemy",
    projectileId: projectileId("projectile.magic_bolt"),
    baseDamageMultiplier: 1,
    baseAreaRadius: 0,
    baseDurationSeconds: 0,
    basePierceBonus: 0
  },
  {
    id: weaponId("weapon.holy_aura"),
    displayName: "Holy Aura",
    description: "Damages enemies within a short radius around the player.",
    iconKey: "weapon_holy_aura",
    behavior: "aura",
    maxLevel: 8,
    baseCooldownSeconds: 1.2,
    shotsPerFire: 1,
    targeting: "self",
    projectileId: null,
    baseDamageMultiplier: 0.7,
    baseAreaRadius: 42,
    baseDurationSeconds: 0.15,
    basePierceBonus: 99
  },
  {
    id: weaponId("weapon.arc_nova"),
    displayName: "Arc Nova",
    description: "Releases a radial burst around the player.",
    iconKey: "weapon_arc_nova",
    behavior: "nova",
    maxLevel: 8,
    baseCooldownSeconds: 2.4,
    shotsPerFire: 8,
    targeting: "self",
    projectileId: null,
    baseDamageMultiplier: 1.2,
    baseAreaRadius: 56,
    baseDurationSeconds: 0.05,
    basePierceBonus: 99
  }
];

// src/sim/content/defs/index.ts
var prototypeContentBundle = {
  playerCharacters: prototypePlayerCharacters,
  enemyArchetypes: prototypeEnemyArchetypes,
  weapons: prototypeWeapons,
  projectiles: prototypeProjectiles,
  passiveUpgrades: prototypePassiveUpgrades,
  pickups: prototypePickups,
  progressionCurves: prototypeProgressionCurves,
  waves: prototypeWaves
};

// src/sim/content/ContentValidation.ts
var ContentValidationError = class extends Error {
  issues;
  constructor(issues) {
    super(formatContentValidationIssues(issues));
    this.name = "ContentValidationError";
    this.issues = issues;
  }
};
function validateContentBundle(bundle) {
  const issues = [];
  for (const [collection, defs] of Object.entries(bundle)) {
    const seenIds = /* @__PURE__ */ new Set();
    for (const def of defs) {
      if (seenIds.has(def.id)) {
        issues.push({
          collection,
          id: def.id,
          message: `Duplicate content ID "${def.id}".`
        });
      } else {
        seenIds.add(def.id);
      }
    }
  }
  const playerIds = new Set(bundle.playerCharacters.map((def) => def.id));
  const enemyIds = new Set(bundle.enemyArchetypes.map((def) => def.id));
  const weaponIds = new Set(bundle.weapons.map((def) => def.id));
  const projectileIds = new Set(bundle.projectiles.map((def) => def.id));
  const pickupIds = new Set(bundle.pickups.map((def) => def.id));
  const progressionCurveIds = new Set(
    bundle.progressionCurves.map((def) => def.id)
  );
  for (const def of bundle.playerCharacters) {
    validatePlayerCharacterRefs(def, weaponIds, issues);
  }
  for (const def of bundle.weapons) {
    validateWeaponRefs(def, projectileIds, issues);
  }
  for (const def of bundle.passiveUpgrades) {
    validatePassiveUpgradeDef(def, issues);
  }
  for (const def of bundle.waves) {
    if (!progressionCurveIds.has(def.progressionCurveId)) {
      issues.push({
        collection: "waves",
        id: def.id,
        message: `Unknown progression curve "${def.progressionCurveId}".`
      });
    }
    for (const entry of def.spawnEntries) {
      if (!enemyIds.has(entry.enemyId)) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Unknown enemy archetype "${entry.enemyId}" in spawn entry.`
        });
      }
      if (entry.endSeconds <= entry.startSeconds) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must end after it starts.`
        });
      }
      if (entry.intervalSeconds <= 0) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must use a positive interval.`
        });
      }
      if (entry.batchSize <= 0) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must use a positive batch size.`
        });
      }
      if (entry.weight <= 0) {
        issues.push({
          collection: "waves",
          id: def.id,
          message: `Spawn entry for "${entry.enemyId}" must use a positive weight.`
        });
      }
    }
  }
  if (bundle.playerCharacters.length === 0) {
    issues.push({
      collection: "playerCharacters",
      id: "player.<missing>",
      message: "At least one player character definition is required."
    });
  }
  if (bundle.enemyArchetypes.length === 0) {
    issues.push({
      collection: "enemyArchetypes",
      id: "enemy.<missing>",
      message: "At least one enemy archetype definition is required."
    });
  }
  if (bundle.weapons.length === 0) {
    issues.push({
      collection: "weapons",
      id: "weapon.<missing>",
      message: "At least one weapon definition is required."
    });
  }
  if (bundle.projectiles.length === 0) {
    issues.push({
      collection: "projectiles",
      id: "projectile.<missing>",
      message: "At least one projectile definition is required."
    });
  }
  if (bundle.pickups.length === 0 || !pickupIds.has("pickup.xp_small")) {
    issues.push({
      collection: "pickups",
      id: "pickup.xp_small",
      message: 'Prototype content must include the "pickup.xp_small" pickup.'
    });
  }
  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }
  void playerIds;
}
function validatePlayerCharacterRefs(def, weaponIds, issues) {
  if (def.starterWeaponIds.length === 0) {
    issues.push({
      collection: "playerCharacters",
      id: def.id,
      message: "Player characters must define at least one starter weapon."
    });
  }
  for (const starterWeaponId of def.starterWeaponIds) {
    if (!weaponIds.has(starterWeaponId)) {
      issues.push({
        collection: "playerCharacters",
        id: def.id,
        message: `Unknown starter weapon "${starterWeaponId}".`
      });
    }
  }
}
function validateWeaponRefs(def, projectileIds, issues) {
  if (def.behavior === "projectile") {
    if (def.projectileId === null) {
      issues.push({
        collection: "weapons",
        id: def.id,
        message: "Projectile weapons must define a projectileId."
      });
    } else if (!projectileIds.has(def.projectileId)) {
      issues.push({
        collection: "weapons",
        id: def.id,
        message: `Unknown projectile "${def.projectileId}".`
      });
    }
  }
  if (def.behavior !== "projectile" && def.projectileId !== null) {
    issues.push({
      collection: "weapons",
      id: def.id,
      message: "Non-projectile weapons must leave projectileId as null."
    });
  }
}
function validatePassiveUpgradeDef(def, issues) {
  if (def.modifiersByLevel.length !== def.maxLevel) {
    issues.push({
      collection: "passiveUpgrades",
      id: def.id,
      message: "Passive upgrade maxLevel must match the number of modifier levels."
    });
  }
}
function formatContentValidationIssues(issues) {
  return issues.map((issue) => `[${issue.collection}] ${issue.id}: ${issue.message}`).join("\n");
}

// src/sim/content/ContentLoader.ts
function loadValidatedContentRegistry(bundle) {
  validateContentBundle(bundle);
  return createContentRegistry(bundle);
}
function loadPrototypeContentRegistry() {
  return loadValidatedContentRegistry(prototypeContentBundle);
}
export {
  ClientSession,
  DEFAULT_SIM_BOUNDS,
  DEFAULT_SIM_CONFIG,
  RunState,
  Sim,
  adaptCocosInput,
  createSim,
  loadPrototypeContentRegistry,
  mergeSimConfig,
  normalizeMovementAxes
};
//# sourceMappingURL=vs-runtime.es.js.map
