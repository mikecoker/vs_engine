import type { ContentBundle } from "../ContentTypes";
import { prototypeEnemyArchetypes } from "./prototypeEnemies";
import { prototypePassiveUpgrades } from "./prototypePassives";
import { prototypePickups } from "./prototypePickups";
import { prototypePlayerCharacters } from "./prototypePlayers";
import { prototypeProgressionCurves } from "./prototypeProgression";
import { prototypeProjectiles } from "./prototypeProjectiles";
import { prototypeWaves } from "./prototypeWaves";
import { prototypeWeapons } from "./prototypeWeapons";

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
