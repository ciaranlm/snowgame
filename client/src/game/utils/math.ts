export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const smoothstep = (current: number, target: number, amount: number): number => current + (target - current) * clamp(amount, 0, 1);
