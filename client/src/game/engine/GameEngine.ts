import { Engine, Scene } from '@babylonjs/core';
import type { AvatarSelection, DebugSettings, GraphicsSettings } from '../types';
import { createResortScene } from '../scenes/ResortScene';

export class GameEngine {
  private readonly engine: Engine;
  private readonly scene: Scene;

  constructor(
    canvas: HTMLCanvasElement,
    avatarSelection: AvatarSelection,
    graphics: GraphicsSettings,
    debug: DebugSettings,
    setPrompt: (text: string | null) => void,
    setSpeed: (speed: number, mode: string | null) => void,
    onRespawnReady: (respawn: () => void, updateGraphics: (next: GraphicsSettings) => void) => void
  ) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    const resort = createResortScene(this.scene, canvas, avatarSelection, graphics, debug, setPrompt, setSpeed);
    onRespawnReady(resort.onRespawn, resort.updateGraphics);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public getFps(): number {
    return this.engine.getFps();
  }

  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}
