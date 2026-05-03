import { pickupId } from "../ContentIds.ts";
import type { PickupDef } from "../ContentTypes.ts";

export const prototypePickups: readonly PickupDef[] = [
  {
    id: pickupId("pickup.xp_small"),
    displayName: "Small XP Gem",
    spriteKey: "pickup_xp_small",
    radius: 8,
    magnetSpeed: 220,
    grantKind: "xp",
    defaultValue: 1,
  },
  {
    id: pickupId("pickup.xp_medium"),
    displayName: "Large XP Crystal",
    spriteKey: "pickup_xp_medium",
    radius: 10,
    magnetSpeed: 220,
    grantKind: "xp",
    defaultValue: 8,
  },
  {
    id: pickupId("pickup.xp_large"),
    displayName: "Boss XP Crystal",
    spriteKey: "pickup_xp_large",
    radius: 12,
    magnetSpeed: 220,
    grantKind: "xp",
    defaultValue: 24,
  },
  {
    id: pickupId("pickup.heal_small"),
    displayName: "Health Heart",
    spriteKey: "pickup_heart_red",
    radius: 10,
    magnetSpeed: 220,
    grantKind: "heal",
    defaultValue: 12,
  },
  {
    id: pickupId("pickup.magnet_small"),
    displayName: "Vacuum Magnet",
    spriteKey: "pickup_magnet_blue",
    radius: 12,
    magnetSpeed: 0,
    grantKind: "magnet",
    defaultValue: 0,
  },
];
