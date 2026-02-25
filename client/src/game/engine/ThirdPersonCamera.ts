import { FreeCamera, Scene, Vector3 } from '@babylonjs/core';

export class ThirdPersonCamera {
  public readonly camera: FreeCamera;
  private readonly desired = new Vector3();
  private readonly lookTarget = new Vector3();

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new FreeCamera('followCam', new Vector3(0, 5, -8), scene);
    this.camera.attachControl(canvas, false);
    this.camera.inputs.clear();
    this.camera.minZ = 0.1;
  }

  public update(target: Vector3, yaw: number): void {
    const backward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw)).scale(-9.4);
    this.desired.copyFrom(target).addInPlace(backward).addInPlaceFromFloats(0, 4.2, 0);
    this.camera.position = Vector3.Lerp(this.camera.position, this.desired, 0.13);
    this.lookTarget.copyFrom(target).addInPlaceFromFloats(0, 1.7, 0);
    this.camera.setTarget(Vector3.Lerp(this.camera.getTarget(), this.lookTarget, 0.2));
  }
}
