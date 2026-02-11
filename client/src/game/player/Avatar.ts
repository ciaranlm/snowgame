import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Quaternion,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from '@babylonjs/core';
import type { AvatarSelection } from '../types';

export type AvatarAnimationState = 'idle' | 'walk' | 'run' | 'jump' | 'wave';

const palette: Record<AvatarSelection['color'], Color3> = {
  cream: new Color3(0.96, 0.88, 0.72),
  cocoa: new Color3(0.55, 0.43, 0.34),
  snow: new Color3(0.95, 0.95, 0.99),
  mint: new Color3(0.69, 0.9, 0.84),
  lavender: new Color3(0.8, 0.73, 0.95)
};

export class Avatar {
  public readonly root = new TransformNode('avatarRoot');
  private state: AvatarAnimationState = 'idle';
  private readonly head: Mesh;
  private readonly leftArm: Mesh;
  private readonly rightArm: Mesh;
  private readonly body: Mesh;
  private elapsed = 0;

  constructor(scene: Scene, private readonly selection: AvatarSelection) {
    this.root.rotationQuaternion = Quaternion.Identity();

    const bodyMat = new PBRMaterial('hamsterBodyMat', scene);
    bodyMat.albedoColor = palette[selection.color];
    bodyMat.roughness = 0.85;

    this.body = MeshBuilder.CreateSphere('body', { diameterX: 1.1, diameterY: 0.9, diameterZ: 0.95 }, scene);
    this.body.material = bodyMat;
    this.body.parent = this.root;
    this.body.position.y = 0.9;

    this.head = MeshBuilder.CreateSphere('head', { diameter: 0.62 }, scene);
    this.head.material = bodyMat;
    this.head.parent = this.root;
    this.head.position.set(0, 1.35, 0.36);

    const earL = MeshBuilder.CreateSphere('earL', { diameter: 0.16 }, scene);
    earL.parent = this.head;
    earL.position.set(-0.18, 0.26, -0.08);
    earL.material = bodyMat;

    const earR = earL.clone('earR')!;
    earR.position.x = 0.18;

    this.leftArm = MeshBuilder.CreateCapsule('leftArm', { radius: 0.06, height: 0.36 }, scene);
    this.leftArm.parent = this.root;
    this.leftArm.position.set(-0.43, 1, 0.2);
    this.leftArm.rotation.z = 0.5;
    this.leftArm.material = bodyMat;

    this.rightArm = this.leftArm.clone('rightArm')!;
    this.rightArm.parent = this.root;
    this.rightArm.position.x = 0.43;
    this.rightArm.rotation.z = -0.5;

    const eyeMat = new StandardMaterial('eyeMat', scene);
    eyeMat.diffuseColor = Color3.Black();
    const eyeL = MeshBuilder.CreateSphere('eyeL', { diameter: 0.05 }, scene);
    eyeL.parent = this.head;
    eyeL.position.set(-0.1, 0.02, 0.29);
    eyeL.material = eyeMat;
    const eyeR = eyeL.clone('eyeR')!;
    eyeR.position.x = 0.1;

    this.attachHat(scene, selection.hat);
  }

  private attachHat(scene: Scene, hat: AvatarSelection['hat']): void {
    const hatMat = new StandardMaterial('hatMat', scene);
    hatMat.diffuseColor = new Color3(0.95, 0.4, 0.45);

    if (hat === 'beanie') {
      const brim = MeshBuilder.CreateCylinder('beanie', { diameterTop: 0.45, diameterBottom: 0.55, height: 0.2 }, scene);
      brim.parent = this.head;
      brim.position.y = 0.24;
      brim.material = hatMat;
    } else if (hat === 'pom') {
      const hatBase = MeshBuilder.CreateCylinder('pomHat', { diameterTop: 0.36, diameterBottom: 0.56, height: 0.3 }, scene);
      hatBase.parent = this.head;
      hatBase.position.y = 0.25;
      hatBase.material = hatMat;
      const pom = MeshBuilder.CreateSphere('pom', { diameter: 0.15 }, scene);
      pom.parent = this.head;
      pom.position.y = 0.46;
      pom.material = hatMat;
    } else {
      const cap = MeshBuilder.CreateCylinder('cap', { diameter: 0.48, height: 0.14 }, scene);
      cap.parent = this.head;
      cap.position.y = 0.2;
      cap.material = hatMat;
      const brim = MeshBuilder.CreateBox('brim', { width: 0.33, height: 0.06, depth: 0.14 }, scene);
      brim.parent = this.head;
      brim.position.set(0, 0.14, 0.32);
      brim.material = hatMat;
    }
  }

  public setState(next: AvatarAnimationState): void {
    this.state = next;
  }

  public update(dt: number): void {
    this.elapsed += dt;
    const pulse = Math.sin(this.elapsed * (this.state === 'run' ? 12 : this.state === 'walk' ? 7 : 3));
    this.body.scaling.y = this.state === 'jump' ? 0.92 : 1 + pulse * 0.02;
    this.head.position.y = 1.35 + pulse * (this.state === 'idle' ? 0.02 : 0.04);
    this.leftArm.rotation.x = pulse * (this.state === 'run' ? 0.8 : this.state === 'walk' ? 0.5 : 0.1);
    this.rightArm.rotation.x = -this.leftArm.rotation.x;

    if (this.state === 'wave') {
      this.rightArm.rotation.x = 0.4 + Math.sin(this.elapsed * 16) * 0.8;
      this.rightArm.rotation.z = -0.9;
    } else {
      this.rightArm.rotation.z = -0.5;
    }
  }

  public dispose(): void {
    this.root.getChildMeshes().forEach((mesh) => mesh.dispose());
    this.root.dispose();
  }

  public setPosition(position: Vector3): void {
    this.root.position.copyFrom(position);
  }

  public setFacing(yaw: number): void {
    this.root.rotationQuaternion = Quaternion.FromEulerAngles(0, yaw, 0);
  }

  public get displayName(): string {
    return this.selection.name;
  }
}
