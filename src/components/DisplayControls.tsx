import React from 'react';
import { WAVE_COLORS } from '../constants';
import { DisplayToggles } from '../types';

export interface AvailableToggles {
  incident?: boolean;
  reflected?: boolean;
  combined?: boolean;
  ghost?: boolean;
  afterimage?: boolean;
  nodesAntinodes?: boolean;
  lambdaTicks?: boolean;
}

interface DisplayControlsProps {
  toggles: DisplayToggles;
  onChange: (next: DisplayToggles) => void;
  available: AvailableToggles;
  incidentLabel?: string;
  reflectedLabel?: string;
  instruction: string;
}

export const DisplayControls: React.FC<DisplayControlsProps> = ({
  toggles,
  onChange,
  available,
  incidentLabel = '入射波（青）',
  reflectedLabel = '反射波（赤）',
  instruction,
}) => {
  const toggleKey = (key: keyof DisplayToggles) => {
    onChange({ ...toggles, [key]: !toggles[key] });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {available.incident && (
          <ToggleButton
            checked={toggles.showIncident}
            onClick={() => toggleKey('showIncident')}
            swatchColor={WAVE_COLORS.incident}
            label={incidentLabel}
          />
        )}
        {available.reflected && (
          <ToggleButton
            checked={toggles.showReflected}
            onClick={() => toggleKey('showReflected')}
            swatchColor={WAVE_COLORS.reflected}
            label={reflectedLabel}
          />
        )}
        {available.combined && (
          <ToggleButton
            checked={toggles.showCombined}
            onClick={() => toggleKey('showCombined')}
            swatchColor={WAVE_COLORS.combined}
            thick
            label="合成波（黒の太線）"
          />
        )}
        {available.ghost && (
          <ToggleButton
            checked={toggles.showGhost}
            onClick={() => toggleKey('showGhost')}
            swatchColor={WAVE_COLORS.ghost}
            dashed
            label="まぼろしの波（灰の点線）"
          />
        )}
        {available.afterimage && (
          <ToggleButton
            checked={toggles.showAfterimage}
            onClick={() => toggleKey('showAfterimage')}
            swatchColor="#64748B"
            label="残像"
          />
        )}
        {available.nodesAntinodes && (
          <ToggleButton
            checked={toggles.showNodesAntinodes}
            onClick={() => toggleKey('showNodesAntinodes')}
            swatchColor={WAVE_COLORS.node}
            label="節と腹の印"
          />
        )}
        {available.lambdaTicks && (
          <ToggleButton
            checked={toggles.showLambdaTicks}
            onClick={() => toggleKey('showLambdaTicks')}
            swatchColor="#475569"
            label="λの目盛り"
          />
        )}
      </div>

      <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700 pt-2 border-t border-slate-100">
        {instruction}
      </p>
    </div>
  );
};

interface ToggleButtonProps {
  checked: boolean;
  onClick: () => void;
  swatchColor: string;
  label: string;
  thick?: boolean;
  dashed?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  checked,
  onClick,
  swatchColor,
  label,
  thick = false,
  dashed = false,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={`inline-flex items-center gap-2 min-h-[42px] px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
        checked
          ? 'bg-slate-900/5 border-slate-400 text-slate-900 font-semibold'
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <span
        aria-hidden="true"
        className={`w-4 h-4 rounded flex items-center justify-center border ${
          checked ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1.2 4L3.8 6.5L8.8 1.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        aria-hidden="true"
        className="w-4 inline-block shrink-0"
        style={{
          borderTopWidth: thick ? '3px' : '2px',
          borderTopStyle: dashed ? 'dashed' : 'solid',
          borderTopColor: swatchColor,
        }}
      />
      <span>{label}</span>
    </button>
  );
};
