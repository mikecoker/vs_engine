# Cocos Hookup

Minimal runtime entry point:
- `VSGameRoot.ts`

Suggested first hookup:
1. Open `assets/default.scene` in Cocos Creator.
2. Select the `Canvas` node.
3. Add the `VSGameRoot` component.
4. Enter play mode.

What the component does:
- creates a sim session from the shared repo code
- reads keyboard input
- steps the sim every frame
- creates simple runtime nodes for player, enemies, projectiles, and pickups
- renders a basic HUD and overlay labels

Current controls:
- `WASD` move
- `P` pause
- `1/2/3` choose level-up option
- `G` grant XP
- `V` spawn test wave

Current limitations:
- visuals are debug primitives only
- no authored prefabs or sprite assets yet
- the script imports shared code from `../../../src/**`, so if Creator complains about external sources, the next step is to mirror or alias shared runtime code into the project more explicitly
