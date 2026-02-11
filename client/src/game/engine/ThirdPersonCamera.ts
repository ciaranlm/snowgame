import { FreeCamera, Scene, Vector3 } from '@babylonjs/core';

export class ThirdPersonCamera {
  public readonly camera: FreeCamera;
  private readonly desired = new Vector3();

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new FreeCamera('followCam', new Vector3(0, 5, -8), scene);
    this.camera.attachControl(canvas, false);
    this.camera.inputs.clear();
    this.camera.minZ = 0.1;
  }

  public update(target: Vector3, yaw: number): void {
    const back = new Vector3(Math.sin(yaw), 0.35, Math.cos(yaw)).scale(-8.2);
    this.desired.copyFrom(target).addInPlace(back);
    this.camera.position = Vector3.Lerp(this.camera.position, this.desired, 0.13);
    const lookAt = target.add(new Vector3(0, 1.3, 0));
    this.camera.setTarget(Vector3.Lerp(this.camera.getTarget(), lookAt, 0.2));
  }
}
