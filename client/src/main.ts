import './style.css';
import { GameEngine } from './game/engine/GameEngine';
import type { AvatarSelection, DebugSettings, GraphicsSettings } from './game/types';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root missing');

app.innerHTML = `
<div class="game-shell">
  <canvas id="game-canvas"></canvas>
  <div class="ui-layer">
    <button class="menu-btn panel" id="menu-btn">☰</button>
    <div class="settings-panel panel" id="settings-panel" hidden>
      <strong>Settings</strong>
      <label><input type="checkbox" id="post-toggle" checked /> Bloom Glow</label>
      <label><input type="checkbox" id="snow-toggle" checked /> Snow Particles</label>
      <label><input type="checkbox" id="fps-toggle" checked /> Show FPS</label>
      <label>Sensitivity <input type="range" id="sens" min="0.4" max="2" step="0.1" value="1" /></label>
      <label><input type="checkbox" id="collider-toggle" /> Show Colliders</label>
      <label><input type="checkbox" id="slope-toggle" /> Show Slope Angle</label>
      <label><input type="checkbox" id="velocity-toggle" /> Show Velocity</label>
      <button id="respawn-btn">Respawn</button>
      <div class="small">Controls: WASD move, mouse look, Space jump, E interact, 1 wave, F snowball, R spawn ramp.</div>
    </div>
    <div class="hud-row" id="hud-row">
      <div class="hud-chip" id="fps-chip">FPS: --</div>
      <div class="hud-chip" id="speed-chip">Speed: 0.0</div>
    </div>
    <div class="context-prompt" id="context" hidden>Press E to interact</div>
    <div class="title-screen" id="title-screen">
      <div class="title-card">
        <h1>Snowy Hamster Hangout</h1>
        <div class="small">Cozy snow resort sandbox prototype</div>
        <label class="row">Name <input id="name-input" maxlength="16" value="Puff" /></label>
        <label class="row">Hamster Color
          <select id="color-select">
            <option value="cream">Cream</option>
            <option value="cocoa">Cocoa</option>
            <option value="snow">Snow</option>
            <option value="mint">Mint</option>
            <option value="lavender">Lavender</option>
          </select>
        </label>
        <label class="row">Hat
          <select id="hat-select">
            <option value="beanie">Beanie</option>
            <option value="pom">Pom Hat</option>
            <option value="cap">Cap</option>
          </select>
        </label>
        <button id="enter-btn">Enter Resort</button>
      </div>
    </div>
  </div>
</div>`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
if (!canvas) throw new Error('Canvas missing');

const settingsPanel = document.querySelector<HTMLDivElement>('#settings-panel')!;
const menuBtn = document.querySelector<HTMLButtonElement>('#menu-btn')!;
const contextPrompt = document.querySelector<HTMLDivElement>('#context')!;
const fpsChip = document.querySelector<HTMLDivElement>('#fps-chip')!;
const speedChip = document.querySelector<HTMLDivElement>('#speed-chip')!;
const titleScreen = document.querySelector<HTMLDivElement>('#title-screen')!;

const graphics: GraphicsSettings = {
  postProcess: true,
  snowParticles: true,
  showFps: true,
  sensitivity: 1
};

const debug: DebugSettings = {
  showColliders: false,
  showSlopeAngle: false,
  showVelocity: false
};

let engine: GameEngine | null = null;
let respawn: () => void = () => {};
let updateGraphics: (next: GraphicsSettings) => void = () => {};

menuBtn.addEventListener('click', () => {
  settingsPanel.hidden = !settingsPanel.hidden;
});

(document.querySelector('#post-toggle') as HTMLInputElement).addEventListener('change', (event) => {
  graphics.postProcess = (event.target as HTMLInputElement).checked;
  updateGraphics(graphics);
});
(document.querySelector('#snow-toggle') as HTMLInputElement).addEventListener('change', (event) => {
  graphics.snowParticles = (event.target as HTMLInputElement).checked;
  updateGraphics(graphics);
});
(document.querySelector('#fps-toggle') as HTMLInputElement).addEventListener('change', (event) => {
  graphics.showFps = (event.target as HTMLInputElement).checked;
  fpsChip.hidden = !graphics.showFps;
});
(document.querySelector('#sens') as HTMLInputElement).addEventListener('input', (event) => {
  graphics.sensitivity = Number((event.target as HTMLInputElement).value);
});
(document.querySelector('#collider-toggle') as HTMLInputElement).addEventListener('change', (event) => {
  debug.showColliders = (event.target as HTMLInputElement).checked;
});
(document.querySelector('#slope-toggle') as HTMLInputElement).addEventListener('change', (event) => {
  debug.showSlopeAngle = (event.target as HTMLInputElement).checked;
});
(document.querySelector('#velocity-toggle') as HTMLInputElement).addEventListener('change', (event) => {
  debug.showVelocity = (event.target as HTMLInputElement).checked;
});
(document.querySelector('#respawn-btn') as HTMLButtonElement).addEventListener('click', () => {
  respawn();
});

const setPrompt = (text: string | null) => {
  if (text) {
    contextPrompt.hidden = false;
    contextPrompt.textContent = text;
  } else {
    contextPrompt.hidden = true;
  }
};

const setSpeed = (speed: number, mode: string | null) => {
  speedChip.textContent = mode ? `${mode.toUpperCase()} ${speed.toFixed(1)} m/s` : `Speed: ${speed.toFixed(1)}`;
};

const startGame = () => {
  const selection: AvatarSelection = {
    name: (document.querySelector('#name-input') as HTMLInputElement).value || 'Puff',
    color: (document.querySelector('#color-select') as HTMLSelectElement).value as AvatarSelection['color'],
    hat: (document.querySelector('#hat-select') as HTMLSelectElement).value as AvatarSelection['hat']
  };

  titleScreen.hidden = true;
  engine = new GameEngine(canvas, selection, graphics, debug, setPrompt, setSpeed, (respawnFn, updateGraphicsFn) => {
    respawn = respawnFn;
    updateGraphics = updateGraphicsFn;
  });

  const tick = () => {
    if (!engine) return;
    fpsChip.textContent = `FPS: ${engine.getFps().toFixed(0)}`;
    requestAnimationFrame(tick);
  };
  tick();
};

(document.querySelector('#enter-btn') as HTMLButtonElement).addEventListener('click', startGame);

window.addEventListener('beforeunload', () => {
  engine?.dispose();
});
