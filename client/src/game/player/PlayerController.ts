import { AbstractMesh, MeshBuilder, Ray, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { Avatar } from './Avatar';
import type { AvatarSelection, DebugSettings, InteractionTarget, ModeController } from '../types';
import { InputManager } from '../engine/InputManager';
import { clamp, smoothstep } from '../utils/math';

export class PlayerController {
  public readonly root = new TransformNode('playerRoot');
  public readonly avatar: Avatar;
  public activeMode: ModeController | null = null;
  public velocity = new Vector3();
  public yaw = 0;
  public speed = 0;
  public slopeAngle = 0;

  private verticalVelocity = 0;
  private grounded = false;
  private interactionTargets: InteractionTarget[] = [];
  private interactCooldown = 0;
  private waveTimer = 0;

  constructor(
    private readonly scene: Scene,
    private readonly input: InputManager,
    avatarSelection: AvatarSelection,
    private readonly debugSettings: DebugSettings,
    private readonly groundMeshes: AbstractMesh[]
  ) {
    this.avatar = new Avatar(scene, avatarSelection);
    this.root.position.set(0, 5, -22);

    if (debugSettings.showColliders) {
      const capsule = MeshBuilder.CreateCapsule('playerCollider', { radius: 0.35, height: 1.6 }, scene);
      capsule.parent = this.root;
      capsule.isPickable = false;
      capsule.visibility = 0.25;
    }
  }

  public setInteractionTargets(targets: InteractionTarget[]): void {
    this.interactionTargets = targets;
  }

  public setMode(mode: ModeController | null): void {
    this.activeMode = mode;
  }

  public update(dt: number): { interactionLabel: string | null } {
    if (this.activeMode) {
      this.activeMode.update(dt);
      this.avatar.update(dt);
      return { interactionLabel: 'Press E to dismount' };
    }

    this.interactCooldown = Math.max(0, this.interactCooldown - dt);
    this.waveTimer = Math.max(0, this.waveTimer - dt);

    const lookX = this.input.consumeLookDeltaX();
    this.yaw += lookX * 0.0023;

    const axis = this.input.movementAxis();
    const moving = Math.abs(axis.x) + Math.abs(axis.z) > 0.03;

    const move = new Vector3(axis.x, 0, axis.z);
    if (move.lengthSquared() > 0) {
      move.normalize();
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const worldX = move.x * cos + move.z * sin;
      const worldZ = -move.x * sin + move.z * cos;
      move.set(worldX, 0, worldZ);
    }

    const sample = this.sampleGround(this.root.position);
    this.slopeAngle = sample.slopeAngle;
    const slopeSlow = clamp(1 - sample.slopeAngle * 0.06, 0.5, 1);
    const targetSpeed = moving ? (this.input.isDown('shift') ? 6.6 : 4.2) * slopeSlow : 0;
    this.speed = smoothstep(this.speed, targetSpeed, dt * 9);

    this.velocity.x = move.x * this.speed;
    this.velocity.z = move.z * this.speed;

    if (this.grounded && this.input.isDown(' ')) {
      this.verticalVelocity = 5.2;
      this.grounded = false;
    }

    this.verticalVelocity -= 16 * dt;
    this.root.position.addInPlace(new Vector3(this.velocity.x * dt, this.verticalVelocity * dt, this.velocity.z * dt));

    const groundedSample = this.sampleGround(this.root.position);
    if (this.root.position.y <= groundedSample.y + 0.9) {
      this.root.position.y = groundedSample.y + 0.9;
      this.verticalVelocity = 0;
      this.grounded = true;
    }

    if (this.waveTimer > 0) {
      this.avatar.setState('wave');
    } else if (!this.grounded) {
      this.avatar.setState('jump');
    } else if (this.speed > 4.8) {
      this.avatar.setState('run');
    } else if (this.speed > 0.25) {
      this.avatar.setState('walk');
    } else {
      this.avatar.setState('idle');
    }

    if (moving) {
      this.avatar.setFacing(this.yaw);
    }

    this.avatar.setPosition(this.root.position);
    this.avatar.update(dt);

    let nearest: InteractionTarget | null = null;
    let minDist = Number.POSITIVE_INFINITY;
    for (const target of this.interactionTargets) {
      const dist = Vector3.Distance(this.root.position, target.position);
      if (dist < target.radius && dist < minDist) {
        nearest = target;
        minDist = dist;
      }
    }

    if (this.input.isDown('1')) {
      this.waveTimer = 0.8;
    }

    if (this.input.isDown('e') && this.interactCooldown <= 0) {
      this.interactCooldown = 0.25;
      if (nearest) {
        nearest.onInteract();
      }
    }

    return { interactionLabel: nearest ? `Press E to ${nearest.label}` : null };
  }

  private sampleGround(position: Vector3): { y: number; slopeAngle: number; slopeDir: Vector3 } {
    const ray = new Ray(new Vector3(position.x, position.y + 20, position.z), Vector3.Down(), 60);
    const pick = this.scene.pickWithRay(ray, (mesh) => this.groundMeshes.includes(mesh));

    if (pick?.hit && pick.pickedPoint && pick.getNormal()) {
      const normal = pick.getNormal()!;
      const slopeAngle = Math.acos(clamp(normal.y, -1, 1)) * (180 / Math.PI);
      const slopeDir = new Vector3(-normal.x, 0, -normal.z).normalize();
      return { y: pick.pickedPoint.y, slopeAngle, slopeDir: slopeDir.lengthSquared() > 0 ? slopeDir : Vector3.Zero() };
    }

    return { y: 0, slopeAngle: 0, slopeDir: Vector3.Zero() };
  }
}
