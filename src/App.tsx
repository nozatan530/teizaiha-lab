import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import {
  EndType,
  PredictionChoice,
  SPEED_OPTIONS,
  WAVE_CONSTANTS,
} from './constants';
import { computeWaveParams } from './physics';
import { DisplayToggles, STEPS_META, StepId } from './types';
import { CompareStep } from './components/CompareStep';
import { ControlBar } from './components/ControlBar';
import { DebugOverlay } from './components/DebugOverlay';
import { DisplayControls } from './components/DisplayControls';
import { EndTypeButtons } from './components/EndTypeButtons';
import { PredictionStep } from './components/PredictionStep';
import { StartScreen } from './components/StartScreen';
import { StepHeader } from './components/StepHeader';
import { WaveCanvas } from './components/WaveCanvas';

const DEFAULT_TOGGLES: DisplayToggles = {
  showIncident: true,
  showReflected: true,
  showCombined: true,
  showGhost: false,
  showAfterimage: false,
  showNodesAntinodes: false,
  showLambdaTicks: false,
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<StepId>('start');
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);

  // Predictions in Step 2 (in-memory only, never persisted)
  const [fixedPrediction, setFixedPrediction] = useState<PredictionChoice | null>(null);
  const [freePrediction, setFreePrediction] = useState<PredictionChoice | null>(null);
  const unlockedFromStep3 = fixedPrediction !== null && freePrediction !== null;

  // Physics & simulation state
  const [lambda, setLambda] = useState<number>(WAVE_CONSTANTS.LAMBDA_INIT);
  const [L, setL] = useState<number>(WAVE_CONSTANTS.L_INIT);
  const [endType, setEndType] = useState<EndType>('fixed');
  const [t, setT] = useState<number>(0);
  const [steadyState, setSteadyState] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedId, setSpeedId] = useState<'normal' | 'slow' | 'very-slow'>('normal');
  const [toggles, setToggles] = useState<DisplayToggles>(DEFAULT_TOGGLES);

  // Step 5 ghost wave folding animation state
  const [foldProgress, setFoldProgress] = useState<number | null>(null);
  const [isFolding, setIsFolding] = useState<boolean>(false);
  const [foldGlow, setFoldGlow] = useState<number>(0);

  const params = useMemo(() => computeWaveParams(lambda), [lambda]);
  const speedMultiplier = useMemo(
    () => SPEED_OPTIONS.find((s) => s.id === speedId)?.multiplier ?? 1,
    [speedId]
  );

  // Switch step and apply step-appropriate initial conditions
  const goToStep = useCallback(
    (step: StepId) => {
      if (typeof step === 'number' && step >= 3 && !unlockedFromStep3) {
        return;
      }

      setFoldProgress(null);
      setIsFolding(false);
      setFoldGlow(0);

      if (step === 'start') {
        setIsPlaying(false);
        setCurrentStep('start');
        return;
      }

      setCurrentStep(step);
      setMaxReachedStep((prev) => Math.max(prev, step));

      const initParams = computeWaveParams(WAVE_CONSTANTS.LAMBDA_INIT);

      if (step === 1) {
        setLambda(WAVE_CONSTANTS.LAMBDA_INIT);
        setL(WAVE_CONSTANTS.L_INIT);
        setSteadyState(true);
        setT(0);
        setIsPlaying(true);
        setToggles({
          showIncident: true,
          showReflected: true,
          showCombined: true,
          showGhost: false,
          showAfterimage: false,
          showNodesAntinodes: false,
          showLambdaTicks: false,
        });
      } else if (step === 2) {
        setIsPlaying(false);
        setLambda(WAVE_CONSTANTS.LAMBDA_INIT);
        setL(WAVE_CONSTANTS.L_INIT);
      } else if (step === 3) {
        setLambda(WAVE_CONSTANTS.LAMBDA_INIT);
        setL(WAVE_CONSTANTS.L_INIT);
        setEndType('fixed');
        setSteadyState(false);
        setT(0);
        setIsPlaying(false);
        setToggles({
          showIncident: true,
          showReflected: true,
          showCombined: true,
          showGhost: false,
          showAfterimage: false,
          showNodesAntinodes: false,
          showLambdaTicks: false,
        });
      } else if (step === 4) {
        setLambda(WAVE_CONSTANTS.LAMBDA_INIT);
        setL(WAVE_CONSTANTS.L_INIT);
        setEndType('free');
        setSteadyState(false);
        setT(0);
        setIsPlaying(false);
        setToggles({
          showIncident: true,
          showReflected: true,
          showCombined: true,
          showGhost: false,
          showAfterimage: false,
          showNodesAntinodes: false,
          showLambdaTicks: false,
        });
      } else if (step === 5) {
        setLambda(WAVE_CONSTANTS.LAMBDA_INIT);
        setL(WAVE_CONSTANTS.L_INIT);
        setEndType('fixed');
        setSteadyState(true);
        setT(initParams.T * 0.25);
        setIsPlaying(true);
        setToggles({
          showIncident: true,
          showReflected: true,
          showCombined: true,
          showGhost: true,
          showAfterimage: false,
          showNodesAntinodes: false,
          showLambdaTicks: false,
        });
      } else if (step === 6) {
        setLambda(WAVE_CONSTANTS.LAMBDA_INIT);
        setL(WAVE_CONSTANTS.L_INIT);
        setEndType('fixed');
        setSteadyState(true);
        setT(initParams.T * 0.25);
        setIsPlaying(true);
        setToggles({
          showIncident: true,
          showReflected: true,
          showCombined: true,
          showGhost: false,
          showAfterimage: true,
          showNodesAntinodes: true,
          showLambdaTicks: true,
        });
      } else if (step === 7) {
        setSteadyState(true);
        setT(params.T * 0.25);
        setIsPlaying(true);
        setToggles({
          showIncident: true,
          showReflected: true,
          showCombined: true,
          showGhost: false,
          showAfterimage: true,
          showNodesAntinodes: true,
          showLambdaTicks: true,
        });
      }
    },
    [unlockedFromStep3, params.T]
  );

  // Main requestAnimationFrame loop for wave simulation
  const lastFrameRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isPlaying || currentStep === 'start' || currentStep === 2) {
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      if (lastFrameRef.current !== null) {
        const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
        setT((prev) => prev + dt * speedMultiplier);
      }
      lastFrameRef.current = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      lastFrameRef.current = null;
    };
  }, [isPlaying, speedMultiplier, currentStep]);

  // Step 5 folding animation loop
  useEffect(() => {
    if (!isFolding) return;

    let rafId = 0;
    let startTime: number | null = null;
    let glowStart: number | null = null;

    const animateFold = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const u = Math.min(1, elapsed / WAVE_CONSTANTS.FOLD_DURATION_MS);
      const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      setFoldProgress(eased);

      if (u < 1) {
        rafId = requestAnimationFrame(animateFold);
      } else {
        // Trigger highlight glow upon landing on the reflected wave
        if (glowStart === null) glowStart = now;
        const glowElapsed = now - glowStart;
        const glowDuration = 550;
        if (glowElapsed < glowDuration) {
          const g = Math.sin((glowElapsed / glowDuration) * Math.PI);
          setFoldGlow(g);
          rafId = requestAnimationFrame(animateFold);
        } else {
          setFoldGlow(0);
          setIsFolding(false);
        }
      }
    };

    rafId = requestAnimationFrame(animateFold);
    return () => cancelAnimationFrame(rafId);
  }, [isFolding]);

  const handleTogglePlay = () => {
    if (!isPlaying && foldProgress !== null) {
      setFoldProgress(null);
      setIsFolding(false);
      setFoldGlow(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleStepFrame = () => {
    setIsPlaying(false);
    if (foldProgress !== null) {
      setFoldProgress(null);
      setIsFolding(false);
      setFoldGlow(0);
    }
    setT((prev) => prev + params.T * WAVE_CONSTANTS.FRAME_STEP_FRACTION);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setFoldProgress(null);
    setIsFolding(false);
    setFoldGlow(0);

    if (currentStep === 3 || currentStep === 4) {
      setSteadyState(false);
      setT(0);
      setToggles((prev) => ({ ...prev, showNodesAntinodes: false }));
    } else if (currentStep === 1) {
      setSteadyState(true);
      setT(0);
    } else {
      setSteadyState(true);
      setT(params.T * 0.25);
    }
  };

  const handleFold = () => {
    setIsPlaying(false);
    setToggles((prev) => ({ ...prev, showGhost: true, showReflected: true }));
    setFoldProgress(0);
    setFoldGlow(0);
    setIsFolding(true);
  };

  const handleUnfold = () => {
    setIsFolding(false);
    setFoldProgress(null);
    setFoldGlow(0);
  };

  const handleChangeEndType = (nextEnd: EndType) => {
    setEndType(nextEnd);
    setFoldProgress(null);
    setIsFolding(false);
    setFoldGlow(0);
  };

  const handleChangeLambda = (nextLambda: number) => {
    setSteadyState(true);
    setLambda(nextLambda);
  };

  const handleWallDragStart = () => {
    setSteadyState(true);
  };

  const handleChangeL = (nextL: number) => {
    setSteadyState(true);
    setL(nextL);
  };

  // Answer check condition for Steps 3 and 4: t >= L/v + 2T
  const answerThreshold = L / WAVE_CONSTANTS.V + 2 * params.T;
  const isStep3AnswerReady = currentStep === 3 && t >= answerThreshold;
  const isStep4AnswerReady = currentStep === 4 && t >= answerThreshold;

  const activeMeta =
    typeof currentStep === 'number'
      ? STEPS_META.find((s) => s.id === currentStep)
      : undefined;

  const getInstruction = () => {
    switch (currentStep) {
      case 1:
        return '黒い線は、右へも左へも進んでいない。まったく動かない点（節）と、大きく揺れる点（腹）を見つけよう。「残像」や「節と腹の印」をオンにすると、揺れの形がくっきり浮かびます。';
      case 3:
        return '再生すると、左の波源から青い入射波が進み、壁（x = 8）に届いた瞬間から赤い反射波が戻り始めます。反射波が重なったところから定在波ができていく様子を見よう。';
      case 4:
        return '自由端のリングが上下に動く様子に注目しよう。壁に届いた瞬間から赤い反射波が戻り始め、端の点（x = 8）がどれだけ大きく揺れるか確かめよう。';
      case 5:
        return '固定端は、壁の向こうの波を上下ひっくり返して折り返すと反射波。自由端は、そのまま折り返すと反射波。「折り返してみる」で赤い反射波とぴったり重なるか確かめよう。';
      case 6:
        return '壁を動かしても、端はいつも同じ。節と腹の並びは、端から決まっている。λの目盛りで、節どうし（腹どうし）の間隔が λ/2 になることも確かめよう。';
      default:
        return '';
    }
  };

  const renderAnswerBanner = (
    stepNum: 3 | 4,
    userChoice: PredictionChoice | null,
    correctChoice: PredictionChoice
  ) => {
    const isCorrect = userChoice === correctChoice;
    const choiceLabel = userChoice === 'node' ? '節' : '腹';
    const nextStep = stepNum === 3 ? 4 : 5;
    const nextLabel = stepNum === 3 ? '④ 自由端で再生へ' : '⑤ まぼろしの波へ';

    return (
      <div
        className={`rounded-xl border p-4 space-y-2 ${
          isCorrect
            ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
            : 'bg-amber-50/70 border-amber-300 text-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            ) : (
              <Info className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
            )}
            <span>
              あなたの予想：{choiceLabel} → {isCorrect ? '予想どおり！' : '予想とちがった'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => goToStep(nextStep)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-slate-800 leading-relaxed">
          {stepNum === 3
            ? '固定端では、反射波が上下反転して戻ってくる。端では入射波と反射波がいつも打ち消し合うので、端は動かない＝節になる。'
            : '自由端では、反射波がそのままの向きで戻ってくる。端では入射波と反射波がいつも強め合うので、端は大きく揺れる（揺れ幅 2A）＝腹になる。'}
        </p>

        <p className="text-xs text-slate-600">
          下の「節と腹の印」をオンにすると、定在波ができた範囲の節と腹の位置を確認できます。
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <StepHeader
        currentStep={currentStep}
        unlockedFromStep3={unlockedFromStep3}
        maxReachedStep={maxReachedStep}
        onSelectStep={goToStep}
      />

      <main className="flex-1 w-full">
        {currentStep === 'start' && (
          <StartScreen
            unlockedFromStep3={unlockedFromStep3}
            onStart={() => goToStep(1)}
            onSelectStep={goToStep}
          />
        )}

        {currentStep !== 'start' && (
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
            {/* Step Heading (for Steps 1, 3, 4, 5, 6, 7) */}
            {currentStep !== 2 && activeMeta && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-base sm:text-xl font-bold text-slate-900">
                  {activeMeta.fullTitle}
                </h1>

                {currentStep === 6 && (
                  <EndTypeButtons value={endType} onChange={handleChangeEndType} />
                )}
              </div>
            )}

            {/* Step 2: Prediction screen */}
            {currentStep === 2 && (
              <PredictionStep
                fixedPrediction={fixedPrediction}
                freePrediction={freePrediction}
                onSelectFixed={setFixedPrediction}
                onSelectFree={setFreePrediction}
                onProceed={() => goToStep(3)}
              />
            )}

            {/* Step 7: Compare Fixed vs Free */}
            {currentStep === 7 && (
              <CompareStep
                L={L}
                lambda={lambda}
                params={params}
                t={t}
                steadyState={steadyState}
                isPlaying={isPlaying}
                speedId={speedId}
                toggles={toggles}
                onTogglePlay={handleTogglePlay}
                onStepFrame={handleStepFrame}
                onReset={handleReset}
                onChangeSpeed={setSpeedId}
                onChangeToggles={setToggles}
                onChangeLambda={handleChangeLambda}
                onWallDragStart={handleWallDragStart}
                onChangeL={handleChangeL}
              />
            )}

            {/* Common Simulation Layout for Steps 1, 3, 4, 5, 6 */}
            {(currentStep === 1 ||
              currentStep === 3 ||
              currentStep === 4 ||
              currentStep === 5 ||
              currentStep === 6) && (
              <div className="space-y-3 sm:space-y-4">
                {/* Top: Wide Wave Canvas */}
                <WaveCanvas
                  mode={currentStep === 1 ? 'step1' : 'wall'}
                  endType={endType}
                  L={L}
                  params={params}
                  t={t}
                  steadyState={steadyState}
                  toggles={toggles}
                  allowMarkers={
                    currentStep === 3
                      ? isStep3AnswerReady
                      : currentStep === 4
                        ? isStep4AnswerReady
                        : true
                  }
                  showEndAmplitude={currentStep !== 1}
                  foldProgress={currentStep === 5 ? foldProgress : null}
                  foldGlow={currentStep === 5 ? foldGlow : 0}
                  draggableWall={currentStep === 6}
                  onWallDragStart={handleWallDragStart}
                  onChangeL={handleChangeL}
                />

                {/* Answer Check Card in Step 3 / Step 4 */}
                {isStep3AnswerReady && renderAnswerBanner(3, fixedPrediction, 'node')}
                {isStep4AnswerReady && renderAnswerBanner(4, freePrediction, 'antinode')}

                {/* Middle: Playback & Parameter Controls */}
                <ControlBar
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  onStepFrame={handleStepFrame}
                  onReset={handleReset}
                  speedId={speedId}
                  onChangeSpeed={setSpeedId}
                  showEndTypeSwitch={currentStep === 5}
                  endType={endType}
                  onChangeEndType={handleChangeEndType}
                  showFoldButton={currentStep === 5}
                  isFolding={isFolding}
                  isFolded={foldProgress !== null && foldProgress >= 0.999}
                  onFold={handleFold}
                  onUnfold={handleUnfold}
                  showLambdaSlider={currentStep === 6}
                  lambda={lambda}
                  onChangeLambda={handleChangeLambda}
                  showWallPositionReadout={currentStep === 6}
                  L={L}
                />

                {/* Bottom: Relevant Display Toggles & Short Instruction */}
                <DisplayControls
                  toggles={toggles}
                  onChange={setToggles}
                  incidentLabel={currentStep === 1 ? '右向きの波（青）' : '入射波（青）'}
                  reflectedLabel={currentStep === 1 ? '左向きの波（赤）' : '反射波（赤）'}
                  available={{
                    incident: true,
                    reflected: true,
                    combined: true,
                    ghost: currentStep === 5,
                    afterimage: true,
                    nodesAntinodes:
                      currentStep === 1 ||
                      currentStep === 5 ||
                      currentStep === 6 ||
                      (currentStep === 3 && isStep3AnswerReady) ||
                      (currentStep === 4 && isStep4AnswerReady),
                    lambdaTicks: currentStep === 3 || currentStep === 4 || currentStep === 6,
                  }}
                  instruction={getInstruction()}
                />
              </div>
            )}

            {/* Step footer navigation (not needed on step 2 since PredictionStep has primary CTA, though back is helpful) */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() =>
                  goToStep(currentStep === 1 ? 'start' : ((currentStep - 1) as StepId))
                }
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{currentStep === 1 ? 'スタートへ' : '前のステップ'}</span>
              </button>

              {currentStep !== 2 && currentStep !== 7 && (
                <button
                  type="button"
                  disabled={currentStep + 1 >= 3 && !unlockedFromStep3}
                  onClick={() => goToStep((currentStep + 1) as StepId)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>
                    次のステップ（
                    {STEPS_META.find((s) => s.id === currentStep + 1)?.numeral}）
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <DebugOverlay />
    </div>
  );
}
