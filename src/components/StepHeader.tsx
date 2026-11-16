import React from 'react';
import { Lock } from 'lucide-react';
import { STEPS_META, StepId } from '../types';

interface StepHeaderProps {
  currentStep: StepId;
  unlockedFromStep3: boolean;
  maxReachedStep: number;
  onSelectStep: (step: StepId) => void;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  currentStep,
  unlockedFromStep3,
  maxReachedStep,
  onSelectStep,
}) => {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectStep('start')}
            className="text-left font-bold text-base sm:text-lg tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 rounded"
          >
            端で決まる定在波ラボ
          </button>
          {currentStep !== 'start' && (
            <button
              type="button"
              onClick={() => onSelectStep('start')}
              className="md:hidden text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              はじめに
            </button>
          )}
        </div>

        <nav
          aria-label="学習ステップ"
          className="flex items-center gap-1 overflow-x-auto pb-0.5 md:pb-0 -mx-1 px-1"
        >
          {STEPS_META.map((step) => {
            const isLocked = step.id >= 3 && !unlockedFromStep3;
            const isActive = currentStep === step.id;
            const isCompletedOrVisited = step.id <= maxReachedStep || unlockedFromStep3;
            const isClickable = !isLocked && (isCompletedOrVisited || step.id <= 2);

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) onSelectStep(step.id);
                }}
                title={
                  isLocked
                    ? '② 予想する で固定端・自由端の両方を予想すると開きます'
                    : step.fullTitle
                }
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-1 min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : isLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isClickable
                        ? 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 cursor-pointer'
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="font-semibold">{step.numeral}</span>
                <span className="hidden lg:inline">{step.shortTitle}</span>
                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
