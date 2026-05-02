import type { SimContent } from "../../sim/core/SimApi.ts";
import type { RenderSnapshot } from "../../sim/core/RenderSnapshot.ts";
import { createClientContentCatalog } from "../content/ClientContentCatalog.ts";
import { EnemyRenderPool, type EnemyViewModel } from "./EnemyRenderPool.ts";
import { PickupRenderPool, type PickupViewModel } from "./PickupRenderPool.ts";
import { presentPlayer, type PlayerViewModel } from "./PlayerPresenter.ts";
import { ProjectileRenderPool, type ProjectileViewModel } from "./ProjectileRenderPool.ts";
import { presentWeaponEffects, type WeaponEffectViewModel } from "./WeaponEffectPresenter.ts";

function getEnemyVisualScale(spriteKey: string): number {
  if (spriteKey === "enemy_boss_lich") {
    return 1.8;
  }

  if (spriteKey === "enemy_miniboss_executioner") {
    return 1.45;
  }

  return 1;
}

function getPickupVisualScale(spriteKey: string): number {
  if (spriteKey === "pickup_xp_large") {
    return 1.7;
  }

  if (spriteKey === "pickup_xp_medium") {
    return 1.35;
  }

  return 1;
}

export interface PresentedRenderFrame {
  readonly elapsedSeconds: number;
  readonly player: PlayerViewModel;
  readonly enemies: readonly EnemyViewModel[];
  readonly projectiles: readonly ProjectileViewModel[];
  readonly pickups: readonly PickupViewModel[];
  readonly weaponEffects: readonly WeaponEffectViewModel[];
}

export class RenderPresenter {
  private readonly content;
  private readonly enemies = new EnemyRenderPool();
  private readonly projectiles = new ProjectileRenderPool();
  private readonly pickups = new PickupRenderPool();

  public constructor(content: SimContent = {}) {
    this.content = createClientContentCatalog(content);
  }

  public present(snapshot: RenderSnapshot): PresentedRenderFrame {
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
      item.tintColor = item.grantKind === "heal"
        ? { r: 255, g: 120, b: 210, a: 255 }
        : item.grantKind === "magnet"
          ? { r: 120, g: 190, b: 255, a: 255 }
          : undefined;
      item.x = snapshot.pickups.posX[index] ?? 0;
      item.y = snapshot.pickups.posY[index] ?? 0;
    }

    return {
      elapsedSeconds: snapshot.elapsedSeconds,
      player: presentPlayer(snapshot.player),
      enemies: enemyItems,
      projectiles: projectileItems,
      pickups: pickupItems,
      weaponEffects: presentWeaponEffects(snapshot, this.content),
    };
  }
}
