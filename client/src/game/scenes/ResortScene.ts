import {
  Color3,
  CubeTexture,
  DirectionalLight,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  Ray,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  Vector3,
  VertexData
} from '@babylonjs/core';
import type { AvatarSelection, DebugSettings, GraphicsSettings, InteractionTarget, RemotePlayerStub } from '../types';
import { InputManager } from '../engine/InputManager';
import { PlayerController } from '../player/PlayerController';
import { ThirdPersonCamera } from '../engine/ThirdPersonCamera';
import { SledMode } from '../modes/SledMode';
import { BoardMode } from '../modes/BoardMode';

interface ResortSceneContext {
  scene: Scene;
  player: PlayerController;
  input: InputManager;
  camera: ThirdPersonCamera;
  interactions: InteractionTarget[];
  setPrompt: (text: string | null) => void;
  setSpeed: (speed: number, mode: string | null) => void;
  onRespawn: () => void;
  updateGraphics: (next: GraphicsSettings) => void;
  remotePlayers: RemotePlayerStub[];
}

export const createResortScene = (
  scene: Scene,
  canvas: HTMLCanvasElement,
  avatarSelection: AvatarSelection,
  graphics: GraphicsSettings,
  debug: DebugSettings,
  setPrompt: (text: string | null) => void,
  setSpeed: (speed: number, mode: string | null) => void
): ResortSceneContext => {
  scene.clearColor.set(0.75, 0.86, 0.98, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.012;
  scene.fogColor = new Color3(0.82, 0.9, 0.96);

  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.65;
  hemi.groundColor = new Color3(0.45, 0.52, 0.65);

  const sun = new DirectionalLight('sun', new Vector3(-0.3, -1, 0.35), scene);
  sun.intensity = 1.1;
  sun.position = new Vector3(30, 50, -30);

  const snowMat = new StandardMaterial('snow', scene);
  snowMat.diffuseColor = new Color3(0.92, 0.96, 1);
  snowMat.specularColor = new Color3(0.45, 0.45, 0.55);
  snowMat.bumpTexture = new Texture('https://assets.babylonjs.com/environments/normalMap.jpg', scene, true, false);
  snowMat.bumpTexture.level = 0.15;

  const terrain = MeshBuilder.CreateGround('terrain', { width: 120, height: 140, subdivisions: 80 }, scene);
  const positions = terrain.getVerticesData(VertexData.PositionKind)!;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const hill = Math.exp(-((x * x) / 1400 + ((z - 45) * (z - 45)) / 900)) * 26;
    const plazaFlatten = Math.exp(-((x * x) / 480 + ((z + 32) * (z + 32)) / 180));
    positions[i + 1] = hill * 0.9 - plazaFlatten * 4 + Math.sin(x * 0.2) * 0.1;
  }
  terrain.setVerticesData(VertexData.PositionKind, positions);
  terrain.convertToFlatShadedMesh();
  terrain.material = snowMat;
  terrain.receiveShadows = true;

  const plaza = MeshBuilder.CreateGround('plaza', { width: 34, height: 28 }, scene);
  plaza.position.set(0, 0.08, -32);
  const plazaMat = new StandardMaterial('plazaMat', scene);
  plazaMat.diffuseColor = new Color3(0.84, 0.9, 0.98);
  plazaMat.alpha = 0.9;
  plaza.material = plazaMat;

  const skybox = MeshBuilder.CreateBox('skyBox', { size: 600 }, scene);
  const skyboxMaterial = new StandardMaterial('skyBoxMaterial', scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new CubeTexture('https://assets.babylonjs.com/environments/skybox', scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;

  const shadowGenerator = new ShadowGenerator(1024, sun);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 24;

  for (let i = 0; i < 16; i++) {
    const lane = i % 2 === 0 ? -4 : 4;
    const z = 58 - i * 6.5;
    const pole = MeshBuilder.CreateCylinder(`pole-${i}`, { diameter: 0.18, height: 2.2 }, scene);
    pole.position.set(lane, 2.2, z);
  }

  const pickupMat = new StandardMaterial('pickup', scene);
  pickupMat.diffuseColor = new Color3(0.93, 0.45, 0.36);
  const sledPickup = MeshBuilder.CreateBox('sledPickup', { width: 1.5, height: 0.35, depth: 0.9 }, scene);
  sledPickup.position.set(-5, 0.5, -28);
  sledPickup.material = pickupMat;

  const boardPickup = MeshBuilder.CreateBox('boardPickup', { width: 1.2, height: 0.15, depth: 2.2 }, scene);
  boardPickup.position.set(5, 0.44, -28);
  boardPickup.material = pickupMat;

  const playerInput = new InputManager(canvas, () => graphics.sensitivity);
  const player = new PlayerController(scene, playerInput, avatarSelection, debug, [terrain, plaza]);
  shadowGenerator.addShadowCaster(player.avatar.root.getChildMeshes()[0]);

  const camera = new ThirdPersonCamera(scene, canvas);

  const activeRideMesh = MeshBuilder.CreateBox('rideMesh', { width: 1.2, height: 0.2, depth: 1.5 }, scene);
  activeRideMesh.isVisible = false;

  const sampleHeight = (position: Vector3): { y: number; slopeDir: Vector3; slopeAngle: number } => {
    const rayPick = scene.pickWithRay(new Ray(new Vector3(position.x, 50, position.z), Vector3.Down(), 120), (mesh) => mesh === terrain || mesh === plaza);
    if (rayPick?.hit && rayPick.pickedPoint && rayPick.getNormal()) {
      const normal = rayPick.getNormal()!;
      const slopeAngle = Math.acos(Math.min(1, Math.max(-1, normal.y))) * (180 / Math.PI);
      const slopeDir = new Vector3(-normal.x, 0, -normal.z);
      return { y: rayPick.pickedPoint.y, slopeDir: slopeDir.lengthSquared() > 0 ? slopeDir.normalize() : Vector3.Zero(), slopeAngle };
    }
    return { y: 0, slopeDir: Vector3.Zero(), slopeAngle: 0 };
  };

  const createRideMode = (kind: 'sled' | 'board') => {
    const ctor = kind === 'sled' ? SledMode : BoardMode;
    const mode = new ctor(
      sampleHeight,
      () => {
        const axis = playerInput.movementAxis();
        return {
          steer: axis.x,
          accel: Math.max(0, axis.z),
          brake: axis.z < -0.2
        };
      },
      (position, yaw, speed) => {
        player.root.position.copyFrom(position);
        player.avatar.setPosition(position);
        player.avatar.setFacing(yaw);
        setSpeed(speed, kind);
      },
      () => {
        player.setMode(null);
        activeRideMesh.isVisible = false;
        setSpeed(0, null);
      }
    );

    const rideColor = kind === 'sled' ? new Color3(0.83, 0.3, 0.28) : new Color3(0.18, 0.32, 0.72);
    const rideMat = new StandardMaterial(`${kind}Mat`, scene);
    rideMat.diffuseColor = rideColor;
    activeRideMesh.material = rideMat;

    return mode;
  };

  const interactions: InteractionTarget[] = [
    {
      id: 'sled',
      label: 'mount sled',
      position: sledPickup.position,
      radius: 2.6,
      onInteract: () => {
        const mode = createRideMode('sled');
        mode.mount(player.root.position.clone(), player.yaw);
        player.setMode(mode);
        activeRideMesh.scaling.set(1.3, 1, 1.2);
        activeRideMesh.isVisible = true;
      }
    },
    {
      id: 'board',
      label: 'mount snowboard',
      position: boardPickup.position,
      radius: 2.6,
      onInteract: () => {
        const mode = createRideMode('board');
        mode.mount(player.root.position.clone(), player.yaw);
        player.setMode(mode);
        activeRideMesh.scaling.set(0.9, 0.8, 1.5);
        activeRideMesh.isVisible = true;
      }
    }
  ];
  player.setInteractionTargets(interactions);

  const puffSystem = new ParticleSystem('puff', 200, scene);
  puffSystem.particleTexture = new Texture('https://playground.babylonjs.com/textures/flare.png', scene);
  puffSystem.minSize = 0.15;
  puffSystem.maxSize = 0.35;
  puffSystem.color1 = new Color3(1, 1, 1).toColor4(0.7);
  puffSystem.color2 = new Color3(0.9, 0.9, 1).toColor4(0.3);
  puffSystem.emitRate = 0;
  puffSystem.minLifeTime = 0.2;
  puffSystem.maxLifeTime = 0.5;

  const snowfall = new ParticleSystem('snowfall', 1200, scene);
  snowfall.particleTexture = new Texture('https://playground.babylonjs.com/textures/flare.png', scene);
  snowfall.emitter = new Vector3(0, 28, 0);
  snowfall.minEmitBox = new Vector3(-80, 0, -80);
  snowfall.maxEmitBox = new Vector3(80, 0, 80);
  snowfall.color1 = new Color3(1, 1, 1).toColor4(0.7);
  snowfall.color2 = new Color3(0.9, 0.95, 1).toColor4(0.45);
  snowfall.minSize = 0.04;
  snowfall.maxSize = 0.1;
  snowfall.emitRate = graphics.snowParticles ? 400 : 0;
  snowfall.minLifeTime = 6;
  snowfall.maxLifeTime = 10;
  snowfall.gravity = new Vector3(0, -0.8, 0);
  snowfall.direction1 = new Vector3(-0.5, -1, -0.3);
  snowfall.direction2 = new Vector3(0.5, -1, 0.3);
  snowfall.start();

  let glow: GlowLayer | null = null;
  if (graphics.postProcess) {
    glow = new GlowLayer('glow', scene, { blurKernelSize: 32 });
    glow.intensity = 0.25;
  }

  const snowballs: { mesh: Mesh; velocity: Vector3; life: number }[] = [];
  const throwSnowball = () => {
    const ball = MeshBuilder.CreateSphere('snowball', { diameter: 0.22 }, scene);
    const mat = new StandardMaterial('snowballMat', scene);
    mat.diffuseColor = new Color3(0.95, 0.98, 1);
    ball.material = mat;
    const start = player.root.position.add(new Vector3(0, 1.2, 0));
    ball.position.copyFrom(start);
    const dir = new Vector3(Math.sin(player.yaw), 0.15, Math.cos(player.yaw)).normalize();
    snowballs.push({ mesh: ball, velocity: dir.scale(11), life: 2.5 });
  };

  let throwLock = false;
  scene.onKeyboardObservable.add((info) => {
    if (info.type === 1 && info.event.key.toLowerCase() === 'f' && !throwLock) {
      throwLock = true;
      throwSnowball();
    }
    if (info.type === 2 && info.event.key.toLowerCase() === 'f') {
      throwLock = false;
    }

    if (info.type === 1 && info.event.key.toLowerCase() === 'r') {
      const ramp = MeshBuilder.CreateBox('ramp', { width: 2.6, height: 0.4, depth: 2.2 }, scene);
      ramp.position = player.root.position.add(new Vector3(Math.sin(player.yaw) * 2.3, 0.35, Math.cos(player.yaw) * 2.3));
      ramp.rotation.y = player.yaw;
      ramp.rotation.x = -0.38;
      ramp.material = pickupMat;
    }
  });

  const remotePlayers: RemotePlayerStub[] = [
    { id: 'stub-1', name: 'Flurry', position: new Vector3(-8, 1, -30) }
  ];

  scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() * 0.001;
    const update = player.update(dt);

    if (playerInput.isDown('e') && player.activeMode) {
      player.activeMode.dismount();
    }

    setPrompt(update.interactionLabel);

    if (player.activeMode) {
      activeRideMesh.position.copyFrom(player.root.position).addInPlace(new Vector3(0, 0.2, 0));
      activeRideMesh.rotation.y = player.yaw;
    }

    for (let i = snowballs.length - 1; i >= 0; i--) {
      const snowball = snowballs[i];
      snowball.life -= dt;
      snowball.velocity.y -= 8 * dt;
      snowball.mesh.position.addInPlace(snowball.velocity.scale(dt));

      const hit = scene.pickWithRay(new Ray(snowball.mesh.position, Vector3.Down(), 0.25), (mesh) => mesh === terrain || mesh === plaza);
      if (snowball.life <= 0 || hit?.hit) {
        puffSystem.emitter = snowball.mesh.position.clone();
        puffSystem.manualEmitCount = 20;
        puffSystem.start();
        snowball.mesh.dispose();
        snowballs.splice(i, 1);
      }
    }

    camera.update(player.root.position, player.yaw);

    if (debug.showVelocity || debug.showSlopeAngle) {
      setSpeed(player.velocity.length(), player.activeMode?.name ?? 'walk');
    }
  });

  return {
    scene,
    player,
    input: playerInput,
    camera,
    interactions,
    setPrompt,
    setSpeed,
    remotePlayers,
    onRespawn: () => {
      player.root.position.set(0, 5, -22);
      player.velocity.set(0, 0, 0);
      player.setMode(null);
    },
    updateGraphics: (next) => {
      snowfall.emitRate = next.snowParticles ? 400 : 0;
      if (next.postProcess && !glow) {
        glow = new GlowLayer('glow', scene, { blurKernelSize: 32 });
        glow.intensity = 0.25;
      } else if (!next.postProcess && glow) {
        glow.dispose();
        glow = null;
      }
    }
  };
};
