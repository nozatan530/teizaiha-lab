export type EndType = 'fixed' | 'free';
export type PredictionChoice = 'node' | 'antinode';

export const WAVE_CONSTANTS = {
  /** Amplitude A (grid units) */
  A: 1.0,
  /** Wave propagation speed v (grid units / second at x1 speed) */
  V: 2.0,
  /** Initial wavelength lambda (grid units) */
  LAMBDA_INIT: 3.2,
  /** Minimum wavelength lambda */
  LAMBDA_MIN: 2.0,
  /** Maximum wavelength lambda */
  LAMBDA_MAX: 5.0,
  /** Step for wavelength slider */
  LAMBDA_STEP: 0.1,
  /** Initial wall position L (grid units) */
  L_INIT: 8.0,
  /** Minimum wall position L */
  L_MIN: 4.0,
  /** Maximum wall position L */
  L_MAX: 10.0,
  /** Display X range */
  X_MIN: 0.0,
  X_MAX: 12.0,
  /** Display Y range */
  Y_MIN: -2.5,
  Y_MAX: 2.5,
  /** Frame step fraction of one period T */
  FRAME_STEP_FRACTION: 1 / 20,
  /** Folding animation duration in milliseconds */
  FOLD_DURATION_MS: 1500,
} as const;

export interface SpeedOption {
  id: 'normal' | 'slow' | 'very-slow';
  label: string;
  multiplierLabel: string;
  multiplier: number;
}

export const SPEED_OPTIONS: readonly SpeedOption[] = [
  { id: 'normal', label: 'ふつう', multiplierLabel: '×1', multiplier: 1 },
  { id: 'slow', label: 'スロー', multiplierLabel: '×0.25', multiplier: 0.25 },
  { id: 'very-slow', label: 'とてもスロー', multiplierLabel: '×0.1', multiplier: 0.1 },
] as const;

export const WAVE_COLORS = {
  incident: '#2563EB', // Blue: 入射波 / 右向きの波
  reflected: '#DC2626', // Red: 反射波 / 左向きの波
  combined: '#0F172A', // Black/Ink: 合成波
  ghost: '#64748B', // Gray: まぼろしの波
  ghostGlow: '#F59E0B', // Highlight flash when folded ghost aligns with reflected wave
  afterimageRgb: '15, 23, 42',
  node: '#4338CA', // Indigo: ●節
  antinode: '#B45309', // Amber-700: ▲腹
  gridLine: '#E2E8F0',
  axisLine: '#94A3B8',
  wallFill: '#CBD5E1',
  wallStroke: '#475569',
} as const;
