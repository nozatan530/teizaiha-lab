import React from 'react';
import { EndType } from '../constants';

interface EndTypeButtonsProps {
  value: EndType;
  onChange: (endType: EndType) => void;
}

export const EndTypeButtons: React.FC<EndTypeButtonsProps> = ({ value, onChange }) => {
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label="端の種類を選択">
      <button
        type="button"
        onClick={() => onChange('fixed')}
        aria-pressed={value === 'fixed'}
        className={`flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
          value === 'fixed'
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
        }`}
      >
        <svg
          width="28"
          height="24"
          viewBox="0 0 28 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          {/* Wall */}
          <rect
            x="20"
            y="2"
            width="6"
            height="20"
            rx="1"
            fill={value === 'fixed' ? '#475569' : '#CBD5E1'}
            stroke={value === 'fixed' ? '#E2E8F0' : '#475569'}
            strokeWidth="1.2"
          />
          <line x1="20" y1="6" x2="26" y2="2" stroke={value === 'fixed' ? '#94A3B8' : '#64748B'} strokeWidth="1" />
          <line x1="20" y1="12" x2="26" y2="8" stroke={value === 'fixed' ? '#94A3B8' : '#64748B'} strokeWidth="1" />
          <line x1="20" y1="18" x2="26" y2="14" stroke={value === 'fixed' ? '#94A3B8' : '#64748B'} strokeWidth="1" />
          {/* String */}
          <path
            d="M2 12 C 7 6, 13 18, 20 12"
            stroke={value === 'fixed' ? '#FFFFFF' : '#0F172A'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Nail pinning string to wall */}
          <circle
            cx="20"
            cy="12"
            r="3"
            fill={value === 'fixed' ? '#F59E0B' : '#0F172A'}
            stroke={value === 'fixed' ? '#0F172A' : '#FFFFFF'}
            strokeWidth="1.2"
          />
        </svg>
        <span>固定端</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('free')}
        aria-pressed={value === 'free'}
        className={`flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
          value === 'free'
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
        }`}
      >
        <svg
          width="28"
          height="24"
          viewBox="0 0 28 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          {/* Rod brackets */}
          <line x1="18" y1="3" x2="24" y2="3" stroke={value === 'free' ? '#CBD5E1' : '#475569'} strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="21" x2="24" y2="21" stroke={value === 'free' ? '#CBD5E1' : '#475569'} strokeWidth="2" strokeLinecap="round" />
          {/* Vertical rod */}
          <line
            x1="21"
            y1="3"
            x2="21"
            y2="21"
            stroke={value === 'free' ? '#94A3B8' : '#64748B'}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* String */}
          <path
            d="M2 14 C 8 11, 14 7, 19 7"
            stroke={value === 'free' ? '#FFFFFF' : '#0F172A'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Sliding ring */}
          <circle
            cx="21"
            cy="7"
            r="3.2"
            fill={value === 'free' ? '#0F172A' : '#FFFFFF'}
            stroke={value === 'free' ? '#F59E0B' : '#0F172A'}
            strokeWidth="2"
          />
        </svg>
        <span>自由端</span>
      </button>
    </div>
  );
};
