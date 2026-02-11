import { Quaternion, TransformNode, Vector3 } from '@babylonjs/core';
import type { ModeController } from '../types';
import { clamp } from '../utils/math';

export class RideModeBase implements ModeController {
  public readonly boardNode = new TransformNode('rideNode');
  protected velocity = new Vector3();
  protected yaw = 0;

  constructor(
    public readonly name: 'sled' | 'board',
    private readonly config: {
      turnRate: number;
      friction: number;
      downhillBoost: number;
    },
    private readonly heightSampler: (position: Vector3) => { y: number; slopeDir: Vector3; slopeAngle: number },
    private readonly input: () => { steer: number; accel: number; brake: boolean },
    private readonly onPose: (position: Vector3, yaw: number, speed: number) => void,
    private readonly onDismount: () => void
  ) {
    this.boardNode.position.set(0, 6, 0);
  }

  public mount(start: Vector3, yaw: number): void {
    this.boardNode.position.copyFrom(start);
    this.yaw = yaw;
    this.velocity.set(0, 0, 0);
  }

  public update(dt: number): void {
    const sample = this.heightSampler(this.boardNode.position);
    const controls = this.input();

    this.yaw += controls.steer * this.config.turnRate * dt;
    const forward = new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));

    const downhillPush = sample.slopeDir.scale(sample.slopeAngle * this.config.downhillBoost * dt);
    this.velocity.addInPlace(downhillPush);
    this.velocity.addInPlace(forward.scale(controls.accel * 6.8 * dt));

    if (controls.brake) {
      this.velocity.scaleInPlace(0.92);
    }

    this.velocity.scaleInPlace(clamp(1 - this.config.friction * dt, 0.2, 1));
    this.boardNode.position.addInPlace(this.velocity.scale(dt));

    const snapped = this.heightSampler(this.boardNode.position);
    this.boardNode.position.y = snapped.y + 0.23;
    this.boardNode.rotationQuaternion = Quaternion.FromEulerAngles(0, this.yaw, 0);

    this.onPose(this.boardNode.position, this.yaw, this.velocity.length());
  }

  public dismount(): void {
    this.onDismount();
  }

  public getSpeed(): number {
    return this.velocity.length();
  }
}
