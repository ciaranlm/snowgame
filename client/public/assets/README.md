# Avatar Asset Replacement Guide

You can replace the procedural hamster with a rigged `avatar.glb`.

## 1) Add your model
- Put your file at `public/assets/avatar.glb`.

## 2) Expected clips
The runtime animation system expects these clip intents:
- `idle`
- `walk`
- `run`
- `jump`
- `wave`

Clip names can differ; map them in `src/game/player/AvatarLoader.ts` and your avatar animation binding layer.

## 3) Loader integration
- `AvatarLoader.tryLoadGlb(scene, 'avatar.glb')` returns an `AssetContainer` and discovered clip names.
- Attach the imported root mesh under the player root transform.
- Cross-fade by stopping current `AnimationGroup` and playing the next with blend settings.

## 4) Fallback behavior
If loading fails, the prototype continues with the built-in primitive hamster rig.
