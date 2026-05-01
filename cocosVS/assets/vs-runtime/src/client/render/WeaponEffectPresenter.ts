import type { RenderSnapshot } from "../../sim/core/RenderSnapshot.ts";
import type { ClientContentCatalog } from "../content/ClientContentCatalog.ts";

const WEAPON_LEVEL_AREA_BONUS = 0.1;
const NOVA_VISIBLE_SECONDS = 0.2;

export interface WeaponEffectViewModel {
  readonly key: string;
  readonly behavior: "aura" | "nova";
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly alpha: number;
  readonly visible: boolean;
}

function levelAreaScale(level: number): number {
  return 1 + Math.max(0, level - 1) * WEAPON_LEVEL_AREA_BONUS;
}

export function presentWeaponEffects(
  snapshot: RenderSnapshot,
  content: ClientContentCatalog,
): readonly WeaponEffectViewModel[] {
  const effects: WeaponEffectViewModel[] = [];
  const player = snapshot.player;
  if (!player.exists) {
    return effects;
  }

  for (let index = 0; index < snapshot.weapons.activeCount; index += 1) {
    const typeId = snapshot.weapons.typeIds[index] ?? -1;
    const visual = content.weapons[typeId];
    if (!visual || (visual.behavior !== "aura" && visual.behavior !== "nova")) {
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
        visible: true,
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
      visible: true,
    });
  }

  return effects;
}
