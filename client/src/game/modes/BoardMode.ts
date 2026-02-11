import type { Vector3 } from '@babylonjs/core';
import { RideModeBase } from './RideModeBase';

export class BoardMode extends RideModeBase {
  constructor(
    heightSampler: (position: Vector3) => { y: number; slopeDir: Vector3; slopeAngle: number },
    input: () => { steer: number; accel: number; brake: boolean },
    onPose: (position: Vector3, yaw: number, speed: number) => void,
    onDismount: () => void
  ) {
    super('board', { turnRate: 2.5, friction: 0.28, downhillBoost: 7.2 }, heightSampler, input, onPose, onDismount);
  }
}
