import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PredictionChoice, WAVE_CONSTANTS } from '../constants';
import { computeWaveParams } from '../physics';
import { WaveCanvas } from './WaveCanvas';

interface PredictionStepProps {
  fixedPrediction: PredictionChoice | null;
  freePrediction: PredictionChoice | null;
  onSelectFixed: (choice: PredictionChoice) => void;
  onSelectFree: (choice: PredictionChoice) => void;
  onProceed: () => void;
}

export const PredictionStep: React.FC<PredictionStepProps> = ({
  fixedPrediction,
  freePrediction,
  onSelectFixed,
  onSelectFree,
  onProceed,
}) => {
  const params = computeWaveParams(WAVE_CONSTANTS.LAMBDA_INIT);
  // Static snapshot at t = 2.6s (incident front at x = 5.2, before reaching L = 8.0)
  const previewTime = 2.6;
  const bothSelected = fixedPrediction !== null && freePrediction !== null;

  const baseToggles = {
    showIncident: true,
    showReflected: false,
    showCombined: true,
    showGhost: false,
    showAfterimage: false,
    showNodesAntinodes: false,
    showLambdaTicks: false,
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          ② 予想する：波が壁に届いたあと、端はどう揺れる？
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          左から来た青い波が右端（x = 8）で反射します。固定端と自由端のそれぞれで、端は「節（まったく振動しない点）」と「腹（最も大きく振動する点）」のどちらになるか選んでください。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fixed end prediction */}
        <section className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900">固定端（くぎで壁に固定）</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              ひもの端が壁にくぎでしっかり留められています。
            </p>
          </div>

          <WaveCanvas
            mode="wall"
            endType="fixed"
            L={WAVE_CONSTANTS.L_INIT}
            params={params}
            t={previewTime}
            steadyState={false}
            toggles={baseToggles}
            allowMarkers={false}
            showEndAmplitude={false}
            heightClassName="h-[200px] sm:h-[230px]"
          />

          <div className="space-y-2 pt-1">
            <p className="text-sm font-semibold text-slate-800">固定端の端は、節？ 腹？</p>
            <div className="grid grid-cols-2 gap-2.5">
              <PredictionButton
                selected={fixedPrediction === 'node'}
                onClick={() => onSelectFixed('node')}
                title="● 節"
                subtitle="まったく振動しない"
              />
              <PredictionButton
                selected={fixedPrediction === 'antinode'}
                onClick={() => onSelectFixed('antinode')}
                title="▲ 腹"
                subtitle="最も大きく振動する"
              />
            </div>
          </div>
        </section>

        {/* Free end prediction */}
        <section className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900">自由端（棒をすべるリング）</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              ひもの先のリングが縦の棒をなめらかに上下に動けます。
            </p>
          </div>

          <WaveCanvas
            mode="wall"
            endType="free"
            L={WAVE_CONSTANTS.L_INIT}
            params={params}
            t={previewTime}
            steadyState={false}
            toggles={baseToggles}
            allowMarkers={false}
            showEndAmplitude={false}
            heightClassName="h-[200px] sm:h-[230px]"
          />

          <div className="space-y-2 pt-1">
            <p className="text-sm font-semibold text-slate-800">自由端の端は、節？ 腹？</p>
            <div className="grid grid-cols-2 gap-2.5">
              <PredictionButton
                selected={freePrediction === 'node'}
                onClick={() => onSelectFree('node')}
                title="● 節"
                subtitle="まったく振動しない"
              />
              <PredictionButton
                selected={freePrediction === 'antinode'}
                onClick={() => onSelectFree('antinode')}
                title="▲ 腹"
                subtitle="最も大きく振動する"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Proceed CTA */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-700">
          {bothSelected
            ? '両方の予想を選びました。次のステップで再生して確かめましょう。'
            : '固定端・自由端の両方で「節」か「腹」を選ぶと、先へ進めます。'}
        </p>
        <button
          type="button"
          disabled={!bothSelected}
          onClick={onProceed}
          className={`inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
            bothSelected
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>再生して確かめよう</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

interface PredictionButtonProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}

const PredictionButton: React.FC<PredictionButtonProps> = ({
  selected,
  onClick,
  title,
  subtitle,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[56px] px-3 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
        selected
          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
          : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-slate-400'
      }`}
    >
      <div className="text-base font-bold">{title}</div>
      <div className={`text-xs mt-0.5 ${selected ? 'text-slate-200' : 'text-slate-500'}`}>
        {subtitle}
      </div>
    </button>
  );
};
