import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { STEPS_META, StepId } from '../types';

interface StartScreenProps {
  unlockedFromStep3: boolean;
  onStart: () => void;
  onSelectStep: (step: StepId) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  unlockedFromStep3,
  onStart,
  onSelectStep,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Hero / Main Question */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-5">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium text-blue-700">
            高校 物理基礎・物理 ／ 波の反射と定在波
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            端で決まる定在波ラボ
          </h1>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">授業で考える問い</h2>
          <p className="text-base sm:text-lg leading-relaxed text-slate-900 font-medium">
            同じ振幅・波長の波が左右から進んできて重なると、波が進まずその場で揺れる『定在波（定常波）』ができます。端がガッチリ固定された『固定端』と、端が自由に動ける『自由端』では、端はそれぞれ定在波の『節（まったく振動しない点）』と『腹（最も大きく振動する点）』のどちらになるでしょうか？
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <span>はじめる</span>
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>
          <span className="text-sm text-slate-600">
            予想してから再生し、自分の目で確かめよう
          </span>
        </div>
      </section>

      {/* 7-step flow overview */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 px-1">観察のながれ（①〜⑦）</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STEPS_META.map((step) => {
            const isLocked = step.id >= 3 && !unlockedFromStep3;
            return (
              <button
                key={step.id}
                type="button"
                disabled={isLocked}
                onClick={() => onSelectStep(step.id)}
                className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                  isLocked
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/70 text-slate-900 cursor-pointer'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <span>{step.fullTitle}</span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLocked ? 'text-slate-400' : 'text-slate-600'}`}>
                    {step.summary}
                  </p>
                </div>
                {isLocked && (
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-1" aria-label="ロック中" />
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
