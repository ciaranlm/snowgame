export class InputManager {
  private keys = new Set<string>();
  private pointerDeltaX = 0;
  private pointerLocked = false;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly sensitivity: () => number) {
    window.addEventListener('keydown', (event) => {
      this.keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock().catch(() => undefined);
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });

    window.addEventListener('mousemove', (event) => {
      if (this.pointerLocked) {
        this.pointerDeltaX += event.movementX * this.sensitivity();
      }
    });
  }

  public consumeLookDeltaX(): number {
    const delta = this.pointerDeltaX;
    this.pointerDeltaX = 0;
    return delta;
  }

  public isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  public movementAxis(): { x: number; z: number } {
    const left = this.isDown('a') || this.isDown('arrowleft');
    const right = this.isDown('d') || this.isDown('arrowright');
    const forward = this.isDown('w') || this.isDown('arrowup');
    const back = this.isDown('s') || this.isDown('arrowdown');

    return {
      x: Number(right) - Number(left),
      z: Number(forward) - Number(back)
    };
  }
}
