import type { Vector3 } from '@babylonjs/core';
import { RideModeBase } from './RideModeBase';

export class SledMode extends RideModeBase {
  constructor(
    heightSampler: (position: Vector3) => { y: number; slopeDir: Vector3; slopeAngle: number },
    input: () => { steer: number; accel: number; brake: boolean },
    onPose: (position: Vector3, yaw: number, speed: number) => void,
    onDismount: () => void
  ) {
    super('sled', { turnRate: 1.8, friction: 0.35, downhillBoost: 8 }, heightSampler, input, onPose, onDismount);
  }
}
