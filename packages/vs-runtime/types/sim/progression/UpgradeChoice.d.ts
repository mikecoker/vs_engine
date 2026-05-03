export declare const MAX_UPGRADE_CHOICES = 3;
export type UpgradeChoiceKind = "passive" | "weapon_unlock" | "weapon_level";
export interface UpgradeChoiceBase {
    readonly choiceId: string;
    readonly kind: UpgradeChoiceKind;
    readonly contentIndex: number;
    readonly contentId: string;
    readonly displayName: string;
    readonly description: string;
    readonly iconKey: string;
    readonly currentLevel: number;
    readonly nextLevel: number;
    readonly maxLevel: number;
}
export interface PassiveUpgradeChoice extends UpgradeChoiceBase {
    readonly kind: "passive";
}
export interface WeaponUnlockChoice extends UpgradeChoiceBase {
    readonly kind: "weapon_unlock";
}
export interface WeaponLevelChoice extends UpgradeChoiceBase {
    readonly kind: "weapon_level";
}
export type UpgradeChoice = PassiveUpgradeChoice | WeaponUnlockChoice | WeaponLevelChoice;
export interface LevelUpPayload {
    readonly level: number;
    readonly xp: number;
    readonly xpToNext: number;
    readonly queuedLevelUps: number;
    readonly choiceCount: number;
    readonly choices: readonly UpgradeChoice[];
}
//# sourceMappingURL=UpgradeChoice.d.ts.map