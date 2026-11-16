import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { WaveParams } from '../physics';
import { DisplayToggles } from '../types';
import { ControlBar } from './ControlBar';
import { DisplayControls } from './DisplayControls';
import { WaveCanvas } from './WaveCanvas';

interface CompareStepProps {
  L: number;
  lambda: number;
  params: WaveParams;
  t: number;
  steadyState: boolean;
  isPlaying: boolean;
  speedId: 'normal' | 'slow' | 'very-slow';
  toggles: DisplayToggles;
  onTogglePlay: () => void;
  onStepFrame: () => void;
  onReset: () => void;
  onChangeSpeed: (id: 'normal' | 'slow' | 'very-slow') => void;
  onChangeToggles: (next: DisplayToggles) => void;
  onChangeLambda: (lambda: number) => void;
  onWallDragStart: () => void;
  onChangeL: (nextL: number) => void;
}

export const CompareStep: React.FC<CompareStepProps> = ({
  L,
  lambda,
  params,
  t,
  steadyState,
  isPlaying,
  speedId,
  toggles,
  onTogglePlay,
  onStepFrame,
  onReset,
  onChangeSpeed,
  onChangeToggles,
  onChangeLambda,
  onWallDragStart,
  onChangeL,
}) => {
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top: Stacked Fixed vs Free synchronized canvases + summary table */}
      <div className="space-y-3">
        {/* Row 1: Fixed End */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3 items-stretch">
          <WaveCanvas
            mode="wall"
            endType="fixed"
            L={L}
            params={params}
            t={t}
            steadyState={steadyState}
            toggles={toggles}
            allowMarkers={true}
            showEndAmplitude={true}
            draggableWall={true}
            onWallDragStart={onWallDragStart}
            onChangeL={onChangeL}
            cornerLabel="固定端（くぎで固定）"
            heightClassName="h-[200px] sm:h-[220px]"
          />
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-center">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <th className="py-1.5 text-left font-medium text-slate-600">端のタイプ</th>
                  <td className="py-1.5 text-right font-bold text-slate-900">固定端</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-slate-600">反射波</th>
                  <td className="py-1.5 text-right font-semibold text-red-600">上下反転する</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-slate-600">端</th>
                  <td className="py-1.5 text-right font-bold text-indigo-700">● 節（0.00 A）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 2: Free End */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3 items-stretch">
          <WaveCanvas
            mode="wall"
            endType="free"
            L={L}
            params={params}
            t={t}
            steadyState={steadyState}
            toggles={toggles}
            allowMarkers={true}
            showEndAmplitude={true}
            draggableWall={true}
            onWallDragStart={onWallDragStart}
            onChangeL={onChangeL}
            cornerLabel="自由端（リングがすべる）"
            heightClassName="h-[200px] sm:h-[220px]"
          />
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-center">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <th className="py-1.5 text-left font-medium text-slate-600">端のタイプ</th>
                  <td className="py-1.5 text-right font-bold text-slate-900">自由端</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-slate-600">反射波</th>
                  <td className="py-1.5 text-right font-semibold text-red-600">そのまま</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-slate-600">端</th>
                  <td className="py-1.5 text-right font-bold text-amber-700">▲ 腹（2.00 A）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Middle: Shared controls */}
      <ControlBar
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onStepFrame={onStepFrame}
        onReset={onReset}
        speedId={speedId}
        onChangeSpeed={onChangeSpeed}
        showLambdaSlider={true}
        lambda={lambda}
        onChangeLambda={onChangeLambda}
        showWallPositionReadout={true}
        L={L}
      />

      {/* Bottom: Toggles + instruction */}
      <DisplayControls
        toggles={toggles}
        onChange={onChangeToggles}
        available={{
          incident: true,
          reflected: true,
          combined: true,
          afterimage: true,
          nodesAntinodes: true,
          lambdaTicks: true,
        }}
        instruction="同じ波長・同じ壁の位置でも、固定端と自由端では反射波の向きが逆になり、節と腹の位置がちょうど入れ替わる。"
      />

      {/* Guiding question + Tap-to-open answer card */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-slate-700">授業の問い（まとめ）</h3>
          <p className="text-sm sm:text-base leading-relaxed text-slate-900">
            同じ振幅・波長の波が左右から進んできて重なると、波が進まずその場で揺れる『定在波（定常波）』ができます。端がガッチリ固定された『固定端』と、端が自由に動ける『自由端』では、端はそれぞれ定在波の『節（まったく振動しない点）』と『腹（最も大きく振動する点）』のどちらになるでしょうか？
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setAnswerOpen((prev) => !prev)}
            aria-expanded={answerOpen}
            className="w-full sm:w-auto inline-flex items-center justify-between gap-3 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <span>{answerOpen ? '答えを閉じる' : 'タップして答えを確かめる'}</span>
            {answerOpen ? (
              <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
          </button>

          {answerOpen && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 text-white space-y-1">
              <div className="text-base sm:text-lg font-bold">
                答え：固定端は「節」、自由端は「腹」
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                固定端は反射波が上下反転して打ち消し合うため端が節（揺れ幅 0）になり、自由端は反射波がそのままの向きで強め合うため端が腹（揺れ幅 2A）になります。
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
