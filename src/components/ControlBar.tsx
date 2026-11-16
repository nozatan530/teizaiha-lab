import React from 'react';
import { Pause, Play, RotateCcw, StepForward, FlipHorizontal2 } from 'lucide-react';
import { EndType, SPEED_OPTIONS, WAVE_CONSTANTS } from '../constants';
import { EndTypeButtons } from './EndTypeButtons';

interface ControlBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepFrame: () => void;
  onReset: () => void;
  speedId: 'normal' | 'slow' | 'very-slow';
  onChangeSpeed: (id: 'normal' | 'slow' | 'very-slow') => void;
  /** Optional end-type switcher (Steps 5, 6) */
  showEndTypeSwitch?: boolean;
  endType?: EndType;
  onChangeEndType?: (endType: EndType) => void;
  /** Optional fold button (Step 5) */
  showFoldButton?: boolean;
  isFolding?: boolean;
  isFolded?: boolean;
  onFold?: () => void;
  onUnfold?: () => void;
  /** Optional wavelength slider (Steps 6, 7) */
  showLambdaSlider?: boolean;
  lambda?: number;
  onChangeLambda?: (lambda: number) => void;
  /** Optional wall position L display/hint (Steps 6, 7) */
  showWallPositionReadout?: boolean;
  L?: number;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  onTogglePlay,
  onStepFrame,
  onReset,
  speedId,
  onChangeSpeed,
  showEndTypeSwitch = false,
  endType = 'fixed',
  onChangeEndType,
  showFoldButton = false,
  isFolding = false,
  isFolded = false,
  onFold,
  onUnfold,
  showLambdaSlider = false,
  lambda = WAVE_CONSTANTS.LAMBDA_INIT,
  onChangeLambda,
  showWallPositionReadout = false,
  L = WAVE_CONSTANTS.L_INIT,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
      {/* Primary playback + speed row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              isPlaying
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>一時停止</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>再生</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepFrame}
            title="1/20 周期ずつ進める"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <StepForward className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>コマ送り</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>最初から</span>
          </button>
        </div>

        {/* Speed segmented selector */}
        <div
          className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80"
          role="group"
          aria-label="再生の速さ"
        >
          {SPEED_OPTIONS.map((opt) => {
            const active = speedId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeSpeed(opt.id)}
                aria-pressed={active}
                className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
                <span className="font-mono-num ml-0.5 text-[11px] sm:text-xs opacity-80">
                  （{opt.multiplierLabel}）
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step-specific secondary row */}
      {(showEndTypeSwitch || showFoldButton || showLambdaSlider || showWallPositionReadout) && (
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {showEndTypeSwitch && onChangeEndType && (
              <EndTypeButtons value={endType} onChange={onChangeEndType} />
            )}

            {showFoldButton && onFold && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isFolding}
                  onClick={onFold}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                >
                  <FlipHorizontal2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isFolding ? '折り返し中…' : isFolded ? 'もう一度折り返す' : '折り返してみる'}</span>
                </button>
                {isFolded && !isFolding && onUnfold && (
                  <button
                    type="button"
                    onClick={onUnfold}
                    className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    もどす
                  </button>
                )}
              </div>
            )}
          </div>

          {(showLambdaSlider || showWallPositionReadout) && (
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              {showLambdaSlider && onChangeLambda && (
                <label className="flex items-center gap-3 flex-1 sm:flex-initial min-w-[210px]">
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    波長 λ：
                    <span className="font-mono-num font-semibold text-slate-900">
                      {lambda.toFixed(1)}
                    </span>{' '}
                    マス
                  </span>
                  <input
                    type="range"
                    min={WAVE_CONSTANTS.LAMBDA_MIN}
                    max={WAVE_CONSTANTS.LAMBDA_MAX}
                    step={WAVE_CONSTANTS.LAMBDA_STEP}
                    value={lambda}
                    onChange={(e) => onChangeLambda(parseFloat(e.target.value))}
                    className="wave-slider flex-1 sm:w-36"
                    aria-label="波長 λ"
                  />
                </label>
              )}

              {showWallPositionReadout && (
                <div className="text-sm text-slate-600 whitespace-nowrap">
                  <span>壁の位置 L：</span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {L.toFixed(1)}
                  </span>{' '}
                  <span>マス（壁を左右にドラッグ）</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
