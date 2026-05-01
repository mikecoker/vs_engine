import { passiveUpgradeId } from "../ContentIds.ts";
import type { PassiveUpgradeDef } from "../ContentTypes.ts";

export const prototypePassiveUpgrades: readonly PassiveUpgradeDef[] = [
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
      [{ stat: "might", mode: "add", value: 0.1 }],
    ],
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
      [{ stat: "areaMultiplier", mode: "add", value: 0.1 }],
    ],
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
      [{ stat: "cooldownMultiplier", mode: "mul", value: 0.92 }],
    ],
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
      [{ stat: "moveSpeed", mode: "add", value: 12 }],
    ],
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
      [{ stat: "pickupRadius", mode: "add", value: 24 }],
    ],
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
      [{ stat: "armor", mode: "add", value: 1 }],
    ],
  },
];
