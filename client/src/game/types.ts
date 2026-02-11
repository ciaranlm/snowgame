import type { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type AvatarColor = 'cream' | 'cocoa' | 'snow' | 'mint' | 'lavender';
export type HatType = 'beanie' | 'pom' | 'cap';

export interface AvatarSelection {
  name: string;
  color: AvatarColor;
  hat: HatType;
}

export interface GraphicsSettings {
  postProcess: boolean;
  snowParticles: boolean;
  showFps: boolean;
  sensitivity: number;
}

export interface DebugSettings {
  showColliders: boolean;
  showSlopeAngle: boolean;
  showVelocity: boolean;
}

export interface InteractionTarget {
  id: string;
  label: string;
  position: Vector3;
  radius: number;
  onInteract: () => void;
}

export interface ModeController {
  readonly name: 'walk' | 'sled' | 'board';
  update: (dt: number) => void;
  dismount: () => void;
  getSpeed: () => number;
}

export interface RemotePlayerStub {
  id: string;
  name: string;
  position: Vector3;
}
