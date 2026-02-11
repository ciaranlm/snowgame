import { AssetContainer, Scene, SceneLoader } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export interface LoadedAvatar {
  container: AssetContainer;
  animationNames: string[];
}

export class AvatarLoader {
  public static async tryLoadGlb(scene: Scene, fileName = 'avatar.glb'): Promise<LoadedAvatar | null> {
    try {
      const container = await SceneLoader.LoadAssetContainerAsync('/assets/', fileName, scene);
      return {
        container,
        animationNames: container.animationGroups.map((group) => group.name)
      };
    } catch {
      return null;
    }
  }
}
