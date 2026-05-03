import type { ContentBundle } from "../ContentTypes.ts";
import { prototypeEnemyArchetypes } from "./prototypeEnemies.ts";
import { prototypePassiveUpgrades } from "./prototypePassives.ts";
import { prototypePickups } from "./prototypePickups.ts";
import { prototypePlayerCharacters } from "./prototypePlayers.ts";
import { prototypeProgressionCurves } from "./prototypeProgression.ts";
import { prototypeProjectiles } from "./prototypeProjectiles.ts";
import { prototypeWaves } from "./prototypeWaves.ts";
import { prototypeWeapons } from "./prototypeWeapons.ts";

export const prototypeContentBundle: ContentBundle = {
  playerCharacters: prototypePlayerCharacters,
  enemyArchetypes: prototypeEnemyArchetypes,
  weapons: prototypeWeapons,
  projectiles: prototypeProjectiles,
  passiveUpgrades: prototypePassiveUpgrades,
  pickups: prototypePickups,
  progressionCurves: prototypeProgressionCurves,
  waves: prototypeWaves,
};

export {
  prototypeEnemyArchetypes,
  prototypePassiveUpgrades,
  prototypePickups,
  prototypePlayerCharacters,
  prototypeProgressionCurves,
  prototypeProjectiles,
  prototypeWaves,
  prototypeWeapons,
};
