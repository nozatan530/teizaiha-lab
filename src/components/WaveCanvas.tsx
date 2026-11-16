import React, { useEffect, useRef, useState } from 'react';
import { EndType, WAVE_COLORS, WAVE_CONSTANTS } from '../constants';
import {
  WaveParams,
  combinedWave,
  computeEndMaxAmplitude,
  foldGhostPoint,
  getNodesAndAntinodes,
  getStandingWaveRange,
  getStep1NodesAndAntinodes,
  ghostWave,
  incidentWave,
  reflectedWave,
  step1Waves,
} from '../physics';
import { DisplayToggles } from '../types';

export interface WaveCanvasProps {
  mode: 'step1' | 'wall';
  endType: EndType;
  L: number;
  params: WaveParams;
  t: number;
  steadyState: boolean;
  toggles: DisplayToggles;
  /** Whether node/antinode markers are allowed to be shown (false before answer check in steps 3/4) */
  allowMarkers?: boolean;
  /** Whether to show top-right end amplitude readout */
  showEndAmplitude?: boolean;
  /** Step 5 folding progress s in [0, 1] or null when not folded */
  foldProgress?: number | null;
  /** Glow intensity [0, 1] when folded ghost wave lands on reflected wave */
  foldGlow?: number;
  /** Whether wall at x=L can be dragged horizontally */
  draggableWall?: boolean;
  onWallDragStart?: () => void;
  onChangeL?: (nextL: number) => void;
  onWallDragEnd?: () => void;
  /** Optional corner label (e.g., "固定端" / "自由端") inside canvas */
  cornerLabel?: string;
  /** Height Tailwind classes */
  heightClassName?: string;
}

export const WaveCanvas: React.FC<WaveCanvasProps> = ({
  mode,
  endType,
  L,
  params,
  t,
  steadyState,
  toggles,
  allowMarkers = true,
  showEndAmplitude = true,
  foldProgress = null,
  foldGlow = 0,
  draggableWall = false,
  onWallDragStart,
  onChangeL,
  onWallDragEnd,
  cornerLabel,
  heightClassName = 'h-[220px] sm:h-[280px] lg:h-[340px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 800, height: 300 });
  const [isDraggingWall, setIsDraggingWall] = useState(false);
  const [isHoveringWall, setIsHoveringWall] = useState(false);

  // Padding inside canvas for crisp axis labels and lambda/2 ticks
  const getPlotRect = (w: number, h: number) => {
    const padLeft = w < 480 ? 34 : 44;
    const padRight = w < 480 ? 14 : 20;
    const padTop = w < 480 ? 28 : 32;
    const padBottom = toggles.showLambdaTicks ? (w < 480 ? 40 : 44) : w < 480 ? 24 : 28;
    const plotW = Math.max(100, w - padLeft - padRight);
    const plotH = Math.max(80, h - padTop - padBottom);
    return { padLeft, padRight, padTop, padBottom, plotW, plotH };
  };

  const xToPx = (x: number, rect: ReturnType<typeof getPlotRect>) => {
    const { X_MIN, X_MAX } = WAVE_CONSTANTS;
    return rect.padLeft + ((x - X_MIN) / (X_MAX - X_MIN)) * rect.plotW;
  };

  const yToPx = (y: number, rect: ReturnType<typeof getPlotRect>) => {
    const { Y_MIN, Y_MAX } = WAVE_CONSTANTS;
    return rect.padTop + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * rect.plotH;
  };

  const pxToX = (px: number, rect: ReturnType<typeof getPlotRect>) => {
    const { X_MIN, X_MAX } = WAVE_CONSTANTS;
    return X_MIN + ((px - rect.padLeft) / rect.plotW) * (X_MAX - X_MIN);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          setSize({ width: Math.round(cr.width), height: Math.round(cr.height) });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Draw frame whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = size.width;
    const h = size.height;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    const rect = getPlotRect(w, h);
    const { X_MIN, X_MAX, Y_MIN, Y_MAX, V } = WAVE_CONSTANTS;
    const isNarrow = w < 480;

    // 1. Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = WAVE_COLORS.gridLine;
    for (let gx = 0; gx <= 12; gx += 1) {
      const px = Math.round(xToPx(gx, rect)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, rect.padTop);
      ctx.lineTo(px, rect.padTop + rect.plotH);
      ctx.stroke();
    }
    for (let gy = -2; gy <= 2; gy += 1) {
      const py = Math.round(yToPx(gy, rect)) + 0.5;
      ctx.beginPath();
      ctx.strokeStyle = gy === 0 ? WAVE_COLORS.axisLine : WAVE_COLORS.gridLine;
      ctx.lineWidth = gy === 0 ? 1.2 : 1;
      ctx.moveTo(rect.padLeft, py);
      ctx.lineTo(rect.padLeft + rect.plotW, py);
      ctx.stroke();
    }

    // Wall region light tint (beyond x = L) in wall mode
    if (mode === 'wall') {
      const wallPx = xToPx(L, rect);
      ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
      ctx.fillRect(wallPx, rect.padTop, rect.padLeft + rect.plotW - wallPx, rect.plotH);
    }

    // Y-axis labels (+2A, +A, 0, -A, -2A)
    ctx.fillStyle = '#64748B';
    ctx.font = `${isNarrow ? 10 : 11}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yLabels: Array<[number, string]> = [
      [2, '+2A'],
      [1, '+A'],
      [0, '0'],
      [-1, '−A'],
      [-2, '−2A'],
    ];
    for (const [val, label] of yLabels) {
      ctx.fillText(label, rect.padLeft - 6, yToPx(val, rect));
    }

    // X-axis numeric ticks (0, 2, 4, 6, 8, 10, 12) when lambda ticks aren't occupying bottom
    if (!toggles.showLambdaTicks || mode === 'step1') {
      ctx.fillStyle = '#94A3B8';
      ctx.font = `${isNarrow ? 10 : 11}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let gx = 0; gx <= 12; gx += 2) {
        ctx.fillText(String(gx), xToPx(gx, rect), rect.padTop + rect.plotH + 5);
      }
    }

    // Lambda/2 ruler ticks below string (anchored at wall L)
    if (mode === 'wall' && toggles.showLambdaTicks) {
      const tickY = rect.padTop + rect.plotH + 4;
      const half = params.lambda / 2;
      ctx.strokeStyle = '#475569';
      ctx.fillStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.font = `${isNarrow ? 10 : 11}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Horizontal baseline from 0 to L
      ctx.beginPath();
      ctx.moveTo(xToPx(0, rect), tickY + 4);
      ctx.lineTo(xToPx(L, rect), tickY + 4);
      ctx.stroke();

      for (let n = 0; ; n++) {
        const xTick = L - n * half;
        if (xTick < -1e-6) break;
        const px = xToPx(xTick, rect);
        ctx.beginPath();
        ctx.moveTo(px, tickY);
        ctx.lineTo(px, tickY + 9);
        ctx.stroke();

        // Label every tick if wide enough, or label whole lambdas + λ/2
        let label = '';
        if (n === 0) label = '端';
        else if (n === 1) label = 'λ/2';
        else if (n % 2 === 0) label = `${n / 2}λ`;
        else label = `${n}λ/2`;

        // Avoid label crowding on very narrow screens when lambda is small
        const pxSpacing = (half / (X_MAX - X_MIN)) * rect.plotW;
        if (pxSpacing >= 34 || n === 0 || n % 2 === 0 || n === 1) {
          ctx.fillText(label, px, tickY + 12);
        }
      }
    }

    // Clip waves vertically inside plot area (with slight headroom for ±2A)
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.padLeft - 2, rect.padTop - 2, rect.plotW + 4, rect.plotH + 4);
    ctx.clip();

    const maxXDomain = mode === 'step1' ? X_MAX : L;
    const domainPxStart = xToPx(0, rect);
    const domainPxEnd = xToPx(maxXDomain, rect);

    // Helper to draw wave sampled at 1px intervals
    const strokeCurve = (
      pxStart: number,
      pxEnd: number,
      evalY: (x: number) => number,
      strokeStyle: string,
      lineWidth: number,
      dash: number[] = []
    ) => {
      if (pxEnd <= pxStart) return;
      ctx.save();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(dash);
      ctx.beginPath();
      const stepPx = 1;
      let started = false;
      for (let px = pxStart; px <= pxEnd; px += stepPx) {
        const x = pxToX(px, rect);
        const y = evalY(x);
        const py = yToPx(y, rect);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      // Ensure exact endpoint
      const xEnd = pxToX(pxEnd, rect);
      ctx.lineTo(pxEnd, yToPx(evalY(xEnd), rect));
      ctx.stroke();
      ctx.restore();
    };

    // 2. Afterimage (残像): recent 1 period T snapshots of combined wave
    if (toggles.showAfterimage && toggles.showCombined) {
      const snapshotCount = 14;
      const startT = steadyState ? t - params.T : Math.max(0, t - params.T);
      if (steadyState || t > 0) {
        for (let i = 0; i < snapshotCount; i++) {
          const frac = i / snapshotCount; // 0 (oldest) -> ~1 (newest)
          const tau = startT + (t - startT) * frac;
          const alpha = 0.045 + 0.16 * Math.pow(frac, 1.3);
          const color = `rgba(${WAVE_COLORS.afterimageRgb}, ${alpha.toFixed(3)})`;

          if (mode === 'step1') {
            strokeCurve(
              domainPxStart,
              domainPxEnd,
              (x) => step1Waves(x, tau, params).y,
              color,
              1.6
            );
          } else {
            strokeCurve(
              domainPxStart,
              domainPxEnd,
              (x) => combinedWave(x, tau, L, endType, params, steadyState),
              color,
              1.6
            );
          }
        }
      }
    }

    // 3. Ghost wave (まぼろしの波) in wall mode
    if (mode === 'wall' && toggles.showGhost) {
      const ghostStart = L;
      const ghostEnd = steadyState ? X_MAX : Math.min(X_MAX, V * t);
      if (ghostEnd > ghostStart) {
        const gPxStart = xToPx(ghostStart, rect);
        const gPxEnd = xToPx(ghostEnd, rect);

        if (foldProgress === null || foldProgress <= 0) {
          strokeCurve(
            gPxStart,
            gPxEnd,
            (x) => ghostWave(x, t, L, params, steadyState),
            WAVE_COLORS.ghost,
            2,
            [6, 5]
          );
        } else {
          // Faint original ghost reference
          strokeCurve(
            gPxStart,
            gPxEnd,
            (x) => ghostWave(x, t, L, params, steadyState),
            'rgba(100, 116, 139, 0.25)',
            1.5,
            [4, 4]
          );

          // Folded ghost wave moving across wall x = L
          ctx.save();
          const numSamples = Math.max(80, Math.round(gPxEnd - gPxStart));
          if (foldGlow > 0) {
            ctx.shadowColor = WAVE_COLORS.ghostGlow;
            ctx.shadowBlur = 10 * foldGlow;
            ctx.strokeStyle = WAVE_COLORS.ghostGlow;
            ctx.lineWidth = 3.2;
          } else {
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.4;
          }
          ctx.setLineDash([7, 4]);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i <= numSamples; i++) {
            const x = ghostStart + ((ghostEnd - ghostStart) * i) / numSamples;
            const yg = ghostWave(x, t, L, params, steadyState);
            const pt = foldGhostPoint(x, yg, L, foldProgress, endType);
            const px = xToPx(pt.x, rect);
            const py = yToPx(pt.y, rect);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 4. Incident wave (Blue)
    if (toggles.showIncident) {
      if (mode === 'step1') {
        strokeCurve(
          domainPxStart,
          domainPxEnd,
          (x) => step1Waves(x, t, params).y1,
          WAVE_COLORS.incident,
          2.2
        );
      } else {
        const incEnd = steadyState ? L : Math.min(L, V * t);
        if (incEnd > 0) {
          strokeCurve(
            xToPx(0, rect),
            xToPx(incEnd, rect),
            (x) => incidentWave(x, t, params, steadyState),
            WAVE_COLORS.incident,
            2.2
          );
        }
      }
    }

    // 5. Reflected wave (Red) — ONLY visible once wavefront reaches wall (t > L/V) or steadyState!
    if (toggles.showReflected) {
      if (mode === 'step1') {
        strokeCurve(
          domainPxStart,
          domainPxEnd,
          (x) => step1Waves(x, t, params).y2,
          WAVE_COLORS.reflected,
          2.2
        );
      } else if (steadyState || t > L / V) {
        const refStart = steadyState ? 0 : Math.max(0, 2 * L - V * t);
        if (L > refStart) {
          strokeCurve(
            xToPx(refStart, rect),
            xToPx(L, rect),
            (x) => reflectedWave(x, t, L, endType, params, steadyState),
            WAVE_COLORS.reflected,
            2.2
          );
        }
      }
    }

    // 6. Combined wave (Black thick line)
    if (toggles.showCombined) {
      if (mode === 'step1') {
        strokeCurve(
          domainPxStart,
          domainPxEnd,
          (x) => step1Waves(x, t, params).y,
          WAVE_COLORS.combined,
          3.2
        );
      } else {
        strokeCurve(
          domainPxStart,
          domainPxEnd,
          (x) => combinedWave(x, t, L, endType, params, steadyState),
          WAVE_COLORS.combined,
          3.2
        );
      }
    }

    // 7. Node & Antinode markers (●節 / ▲腹)
    if (allowMarkers && toggles.showNodesAntinodes) {
      const positions =
        mode === 'step1'
          ? getStep1NodesAndAntinodes(params.lambda)
          : getNodesAndAntinodes(
              L,
              params.lambda,
              endType,
              getStandingWaveRange(t, L, steadyState)
            );

      const fontSize = isNarrow ? 10 : 11;
      ctx.font = `600 ${fontSize}px "Noto Sans JP", sans-serif`;
      ctx.textAlign = 'center';

      // Nodes: ●節 right on equilibrium line y = 0, label slightly below y = 0
      for (const xn of positions.nodes) {
        const px = xToPx(xn, rect);
        const py = yToPx(0, rect);

        ctx.save();
        ctx.fillStyle = WAVE_COLORS.node;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label tag
        ctx.fillStyle = WAVE_COLORS.node;
        ctx.textBaseline = 'top';
        ctx.fillText('●節', px, py + 9);
        ctx.restore();
      }

      // Antinodes: vertical amplitude span guide + ▲ at y = +2A or top + "▲腹" label
      for (const xa of positions.antinodes) {
        const px = xToPx(xa, rect);
        const pyTop = yToPx(2.0, rect);
        const pyBot = yToPx(-2.0, rect);

        ctx.save();
        // Subtle dashed amplitude guide
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, pyTop);
        ctx.lineTo(px, pyBot);
        ctx.stroke();
        ctx.setLineDash([]);

        // Upward triangle ▲ at y = 2A
        const triY = pyTop;
        ctx.fillStyle = WAVE_COLORS.antinode;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, triY - 6);
        ctx.lineTo(px - 5.5, triY + 4);
        ctx.lineTo(px + 5.5, triY + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = WAVE_COLORS.antinode;
        ctx.textBaseline = 'bottom';
        ctx.fillText('▲腹', px, triY - 8);
        ctx.restore();
      }
    }

    // 8. Wall / Ring & Source Oscillator rendering
    if (mode === 'wall') {
      const wallPx = xToPx(L, rect);
      const yEnd = combinedWave(L, t, L, endType, params, steadyState);
      const yEndPx = yToPx(yEnd, rect);

      if (endType === 'fixed') {
        // Solid hatched wall on the right of x = L
        const wallWidth = isNarrow ? 12 : 16;
        const wallTop = rect.padTop + 6;
        const wallBottom = rect.padTop + rect.plotH - 6;

        ctx.save();
        ctx.fillStyle = '#E2E8F0';
        ctx.strokeStyle = WAVE_COLORS.wallStroke;
        ctx.lineWidth = 1.5;
        ctx.fillRect(wallPx, wallTop, wallWidth, wallBottom - wallTop);
        ctx.strokeRect(wallPx, wallTop, wallWidth, wallBottom - wallTop);

        // Diagonal hatching
        ctx.beginPath();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        for (let hy = wallTop + 8; hy < wallBottom; hy += 10) {
          ctx.moveTo(wallPx, hy);
          ctx.lineTo(wallPx + wallWidth, hy - 8);
        }
        ctx.stroke();

        // Nail (くぎ) pinning string to wall at (L, 0)
        const pyZero = yToPx(0, rect);
        // Nail shaft into wall
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wallPx - 2, pyZero);
        ctx.lineTo(wallPx + 10, pyZero);
        ctx.stroke();

        // Large highlighted end-point dot at x = L
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(wallPx, yEndPx, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        // Free end: Vertical guide rod + brackets + sliding ring
        const rodTop = yToPx(2.25, rect);
        const rodBottom = yToPx(-2.25, rect);

        ctx.save();
        // Top & bottom mounting brackets
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wallPx - 7, rodTop);
        ctx.lineTo(wallPx + 9, rodTop);
        ctx.moveTo(wallPx - 7, rodBottom);
        ctx.lineTo(wallPx + 9, rodBottom);
        ctx.stroke();

        // Vertical rod
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(wallPx, rodTop);
        ctx.lineTo(wallPx, rodBottom);
        ctx.stroke();

        // Highlighted sliding ring at (L, yEnd)
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(wallPx, yEndPx, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner amber accent ring
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(wallPx, yEndPx, 5.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Wall drag handle indicator when draggable
      if (draggableWall) {
        const handleY = rect.padTop + rect.plotH - 18;
        ctx.save();
        ctx.fillStyle = isDraggingWall ? '#0F172A' : isHoveringWall ? '#1E293B' : '#334155';
        ctx.beginPath();
        ctx.roundRect(wallPx - 18, handleY - 10, 36, 20, 6);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 10px "Noto Sans JP", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀ ▶', wallPx, handleY + 0.5);
        ctx.restore();
      }
    }

    // Source dot at x = 0
    const ySource =
      mode === 'step1'
        ? step1Waves(0, t, params).y
        : combinedWave(0, t, L, endType, params, steadyState);
    ctx.save();
    ctx.fillStyle = WAVE_COLORS.incident;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(xToPx(0, rect), yToPx(ySource, rect), 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // End clip

    // Optional label at top-left of plot area
    if (cornerLabel) {
      ctx.save();
      ctx.fillStyle = '#0F172A';
      ctx.font = `700 ${isNarrow ? 12 : 13}px "Noto Sans JP", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(cornerLabel, rect.padLeft + 6, 8);
      ctx.restore();
    }

    ctx.restore();
  }, [
    size,
    mode,
    endType,
    L,
    params,
    t,
    steadyState,
    toggles,
    allowMarkers,
    foldProgress,
    foldGlow,
    draggableWall,
    isDraggingWall,
    isHoveringWall,
    cornerLabel,
  ]);

  // Pointer handlers for wall dragging (Step 6 & 7)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggableWall || mode !== 'wall' || !onChangeL) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const px = e.clientX - bounds.left;
    const rect = getPlotRect(size.width, size.height);
    const wallPx = xToPx(L, rect);

    if (Math.abs(px - wallPx) <= 32) {
      canvas.setPointerCapture(e.pointerId);
      setIsDraggingWall(true);
      onWallDragStart?.();
      const rawX = pxToX(px, rect);
      const clamped = Math.max(WAVE_CONSTANTS.L_MIN, Math.min(WAVE_CONSTANTS.L_MAX, rawX));
      onChangeL(Math.round(clamped * 10) / 10);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggableWall || mode !== 'wall') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const px = e.clientX - bounds.left;
    const rect = getPlotRect(size.width, size.height);
    const wallPx = xToPx(L, rect);

    setIsHoveringWall(Math.abs(px - wallPx) <= 32);

    if (isDraggingWall && onChangeL) {
      const rawX = pxToX(px, rect);
      const clamped = Math.max(WAVE_CONSTANTS.L_MIN, Math.min(WAVE_CONSTANTS.L_MAX, rawX));
      onChangeL(Math.round(clamped * 10) / 10);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingWall) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDraggingWall(false);
    onWallDragEnd?.();
  };

  const endAmp =
    mode === 'wall' && showEndAmplitude
      ? computeEndMaxAmplitude(t, L, endType, params, steadyState)
      : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClassName} bg-white rounded-xl border border-slate-200 overflow-hidden select-none`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          setIsHoveringWall(false);
        }}
        style={{ touchAction: 'none' }}
        className={`block w-full h-full ${
          draggableWall
            ? isDraggingWall || isHoveringWall
              ? 'cursor-ew-resize'
              : 'cursor-default'
            : ''
        }`}
        aria-label={
          mode === 'step1'
            ? '壁なしの重ね合わせシミュレーション'
            : `${endType === 'fixed' ? '固定端' : '自由端'}の定在波シミュレーション`
        }
      />

      {endAmp !== null && (
        <div className="pointer-events-none absolute top-2 right-2 sm:top-2.5 sm:right-3 bg-white/95 border border-slate-200 rounded-lg px-2.5 py-1 shadow-xs">
          <span className="text-[11px] sm:text-xs font-medium text-slate-600">端の揺れ幅：</span>
          <span className="font-mono-num text-xs sm:text-sm font-semibold text-slate-900">
            {endAmp.toFixed(2)} A
          </span>
        </div>
      )}
    </div>
  );
};
