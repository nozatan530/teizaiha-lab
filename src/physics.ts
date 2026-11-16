import { EndType, WAVE_CONSTANTS } from './constants';

export interface WaveParams {
  lambda: number;
  k: number;
  f: number;
  omega: number;
  T: number;
}

export interface StandingWaveRange {
  minX: number;
  maxX: number;
  exists: boolean;
}

export interface NodeAntinodePositions {
  nodes: number[];
  antinodes: number[];
}

export interface PhysicsCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface PhysicsVerificationResult {
  allPassed: boolean;
  checks: PhysicsCheckItem[];
}

/**
 * Derive angular wavenumber k, frequency f, angular frequency omega, and period T from wavelength lambda.
 */
export function computeWaveParams(lambda: number): WaveParams {
  const k = (2 * Math.PI) / lambda;
  const f = WAVE_CONSTANTS.V / lambda;
  const omega = 2 * Math.PI * f;
  const T = 1 / f;
  return { lambda, k, f, omega, T };
}

/**
 * Step 1 (no wall): two counter-propagating waves across the full [0, 12] domain.
 */
export function step1Waves(
  x: number,
  t: number,
  params: WaveParams
): { y1: number; y2: number; y: number } {
  const { A } = WAVE_CONSTANTS;
  const y1 = A * Math.sin(params.omega * t - params.k * x);
  const y2 = A * Math.sin(params.omega * t + params.k * x);
  const y = y1 + y2;
  return { y1, y2, y };
}

/**
 * Incident wave y_i(x, t) = A sin(ωt - kx), 0 ahead of the wavefront x > v*t (unless steadyState).
 */
export function incidentWave(
  x: number,
  t: number,
  params: WaveParams,
  steadyState = false
): number {
  const { A, V } = WAVE_CONSTANTS;
  if (x < 0) return 0;
  if (!steadyState && x > V * t) return 0;
  return A * Math.sin(params.omega * t - params.k * x);
}

/**
 * Reflected wave y_r(x, t) = ±A sin(ωt - k(2L - x)), 0 ahead of reflected front 2L - x > v*t (unless steadyState).
 * Fixed end: -A sin(...), Free end: +A sin(...).
 */
export function reflectedWave(
  x: number,
  t: number,
  L: number,
  endType: EndType,
  params: WaveParams,
  steadyState = false
): number {
  const { A, V } = WAVE_CONSTANTS;
  if (x < 0 || x > L) return 0;
  const pathLength = 2 * L - x;
  if (!steadyState && pathLength > V * t) return 0;
  const sign = endType === 'fixed' ? -1 : 1;
  return sign * A * Math.sin(params.omega * t - params.k * pathLength);
}

/**
 * Ghost wave beyond the wall (L <= x <= 12): y_g(x, t) = A sin(ωt - kx), obeying the same wavefront condition.
 */
export function ghostWave(
  x: number,
  t: number,
  L: number,
  params: WaveParams,
  steadyState = false
): number {
  const { A, V, X_MAX } = WAVE_CONSTANTS;
  if (x < L || x > X_MAX) return 0;
  if (!steadyState && x > V * t) return 0;
  return A * Math.sin(params.omega * t - params.k * x);
}

/**
 * Combined wave y(x, t) = y_i(x, t) + y_r(x, t) for 0 <= x <= L.
 */
export function combinedWave(
  x: number,
  t: number,
  L: number,
  endType: EndType,
  params: WaveParams,
  steadyState = false
): number {
  if (x < 0 || x > L) return 0;
  return (
    incidentWave(x, t, params, steadyState) +
    reflectedWave(x, t, L, endType, params, steadyState)
  );
}

/**
 * Region along [0, L] where both incident and reflected waves are present.
 */
export function getStandingWaveRange(
  t: number,
  L: number,
  steadyState = false
): StandingWaveRange {
  const { V } = WAVE_CONSTANTS;
  if (steadyState) {
    return { minX: 0, maxX: L, exists: true };
  }
  if (t <= L / V) {
    return { minX: L, maxX: L, exists: false };
  }
  const front = V * t;
  const reflectedFront = 2 * L - front;
  const minX = Math.max(0, reflectedFront);
  const maxX = Math.min(L, front);
  return { minX, maxX, exists: maxX > minX };
}

/**
 * Node and antinode x-coordinates within [0, L] filtered to the formed standing wave range.
 */
export function getNodesAndAntinodes(
  L: number,
  lambda: number,
  endType: EndType,
  range: StandingWaveRange
): NodeAntinodePositions {
  if (!range.exists) {
    return { nodes: [], antinodes: [] };
  }
  const half = lambda / 2;
  const quarter = lambda / 4;
  const eps = 1e-9;
  const low = Math.max(0, range.minX) - eps;
  const high = Math.min(L, range.maxX) + eps;

  const nodes: number[] = [];
  const antinodes: number[] = [];

  for (let n = 0; ; n++) {
    const x0 = L - n * half;
    const x1 = L - quarter - n * half;
    if (x0 < -eps && x1 < -eps) break;

    if (endType === 'fixed') {
      if (x0 >= low && x0 <= high) nodes.push(x0);
      if (x1 >= low && x1 <= high) antinodes.push(x1);
    } else {
      if (x0 >= low && x0 <= high) antinodes.push(x0);
      if (x1 >= low && x1 <= high) nodes.push(x1);
    }
  }

  return { nodes, antinodes };
}

/**
 * Node and antinode positions for Step 1 (no wall: y = 2A cos(kx) sin(ωt)).
 */
export function getStep1NodesAndAntinodes(lambda: number): NodeAntinodePositions {
  const { X_MIN, X_MAX } = WAVE_CONSTANTS;
  const half = lambda / 2;
  const quarter = lambda / 4;
  const eps = 1e-9;

  const nodes: number[] = [];
  const antinodes: number[] = [];

  for (let n = 0; ; n++) {
    const xNode = quarter + n * half;
    const xAnti = n * half;
    if (xNode > X_MAX + eps && xAnti > X_MAX + eps) break;

    if (xNode >= X_MIN - eps && xNode <= X_MAX + eps) nodes.push(xNode);
    if (xAnti >= X_MIN - eps && xAnti <= X_MAX + eps) antinodes.push(xAnti);
  }

  return { nodes, antinodes };
}

/**
 * Maximum displacement at x = L over the most recent 1 period T.
 */
export function computeEndMaxAmplitude(
  t: number,
  L: number,
  endType: EndType,
  params: WaveParams,
  steadyState = false
): number {
  const samples = 120;
  const startT = steadyState ? t - params.T : Math.max(0, t - params.T);
  const endT = t;
  if (endT <= startT && !steadyState) {
    const val = Math.abs(combinedWave(L, endT, L, endType, params, steadyState));
    return val < 1e-9 ? 0 : val;
  }

  let maxVal = 0;
  for (let i = 0; i <= samples; i++) {
    const tau = startT + ((endT - startT) * i) / samples;
    const val = Math.abs(combinedWave(L, tau, L, endType, params, steadyState));
    if (val > maxVal) maxVal = val;
  }

  return maxVal < 1e-9 ? 0 : maxVal;
}

/**
 * Fold transformation for Step 5 ghost wave animation.
 * s goes from 0 -> 1:
 * x' = L + (x - L) cos(πs)
 * y' = y * c(s), where c(s) = cos(πs) for fixed end, 1 for free end.
 */
export function foldGhostPoint(
  x: number,
  y: number,
  L: number,
  s: number,
  endType: EndType
): { x: number; y: number } {
  const cosPiS = Math.cos(Math.PI * s);
  const c = endType === 'fixed' ? cosPiS : 1;
  return {
    x: L + (x - L) * cosPiS,
    y: y * c,
  };
}

/**
 * Automated verification suite for the physics model (displayed when ?debug=1).
 */
export function verifyPhysics(): PhysicsVerificationResult {
  const { A, V } = WAVE_CONSTANTS;
  const testLambdas = [2.0, 3.2, 4.5];
  const testLs = [4.5, 8.0, 9.7];

  let maxFixedEndError = 0;
  let maxFreeEndAmpError = 0;
  let maxNodeError = 0;
  let maxAntinodeAmpError = 0;
  let maxSumError = 0;

  for (const lambda of testLambdas) {
    const params = computeWaveParams(lambda);
    for (const L of testLs) {
      const tStart = L / V + params.T * 1.2;

      // 1. Fixed end: x = L displacement always 0 for t > L/v
      for (let i = 0; i <= 40; i++) {
        const tau = tStart + (params.T * i) / 40;
        const yFixed = Math.abs(combinedWave(L, tau, L, 'fixed', params, false));
        if (yFixed > maxFixedEndError) maxFixedEndError = yFixed;
      }

      // 2. Free end: x = L recent 1-period max amplitude is 2A
      const freeAmp = computeEndMaxAmplitude(tStart + params.T, L, 'free', params, false);
      const ampErr = Math.abs(freeAmp - 2 * A);
      if (ampErr > maxFreeEndAmpError) maxFreeEndAmpError = ampErr;

      // 3. Inside standing wave region, nodes have y = 0 and antinodes have max amplitude 2A
      const tCheck = tStart + params.T;
      const range = getStandingWaveRange(tCheck, L, false);
      for (const endType of ['fixed', 'free'] as const) {
        const { nodes, antinodes } = getNodesAndAntinodes(L, lambda, endType, range);
        for (const xn of nodes) {
          for (let i = 0; i <= 24; i++) {
            const tau = tCheck - (params.T * i) / 24;
            // Ensure tau is after the wave reached xn (2L - xn <= V * tau)
            if (2 * L - xn <= V * tau) {
              const yn = Math.abs(combinedWave(xn, tau, L, endType, params, false));
              if (yn > maxNodeError) maxNodeError = yn;
            }
          }
        }
        for (const xa of antinodes) {
          // Only check antinodes that have experienced at least a full period of standing wave
          if (2 * L - xa <= V * (tCheck - params.T)) {
            let localMax = 0;
            for (let i = 0; i <= 120; i++) {
              const tau = tCheck - (params.T * i) / 120;
              const ya = Math.abs(combinedWave(xa, tau, L, endType, params, false));
              if (ya > localMax) localMax = ya;
            }
            const err = Math.abs(localMax - 2 * A);
            if (err > maxAntinodeAmpError) maxAntinodeAmpError = err;
          }
        }
      }

      // 4. Combined === incident + reflected across [0, L]
      for (let xi = 0; xi <= 50; xi++) {
        const x = (L * xi) / 50;
        for (const endType of ['fixed', 'free'] as const) {
          const yi = incidentWave(x, tCheck, params, false);
          const yr = reflectedWave(x, tCheck, L, endType, params, false);
          const yc = combinedWave(x, tCheck, L, endType, params, false);
          const err = Math.abs(yc - (yi + yr));
          if (err > maxSumError) maxSumError = err;
        }
      }
    }
  }

  const checks: PhysicsCheckItem[] = [
    {
      id: 'fixed-end-zero',
      label: '固定端 x=L の変位が常に 0（t > L/v）',
      passed: maxFixedEndError <= 1e-9,
      detail: `最大誤差: ${maxFixedEndError.toExponential(2)}`,
    },
    {
      id: 'free-end-amp',
      label: '自由端 x=L の直近1周期振幅が 2A',
      passed: maxFreeEndAmpError <= 1e-2,
      detail: `誤差: ${maxFreeEndAmpError.toExponential(2)}`,
    },
    {
      id: 'nodes-antinodes',
      label: '定在波範囲内で節=0・腹振幅=2A',
      passed: maxNodeError <= 1e-9 && maxAntinodeAmpError <= 1e-2,
      detail: `節: ${maxNodeError.toExponential(1)} / 腹: ${maxAntinodeAmpError.toExponential(1)}`,
    },
    {
      id: 'superposition-sum',
      label: '合成波(黒) = 入射波(青) + 反射波(赤)',
      passed: maxSumError <= 1e-12,
      detail: `最大誤差: ${maxSumError.toExponential(2)}`,
    },
  ];

  return {
    allPassed: checks.every((c) => c.passed),
    checks,
  };
}
