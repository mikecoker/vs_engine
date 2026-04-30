import { pickupId } from "../ContentIds";
import type { PickupDef } from "../ContentTypes";

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
];
