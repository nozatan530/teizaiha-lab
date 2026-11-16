import React, { useMemo } from 'react';
import { verifyPhysics } from '../physics';

export const DebugOverlay: React.FC = () => {
  const isDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';

  const result = useMemo(() => {
    if (!isDebug) return null;
    return verifyPhysics();
  }, [isDebug]);

  if (!isDebug || !result) return null;

  return (
    <aside
      aria-label="物理計算チェック"
      className="fixed bottom-3 right-3 z-50 max-w-xs bg-white/95 backdrop-blur-sm border border-slate-300 rounded-xl p-3 shadow-lg text-xs"
    >
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
        <span className="font-bold text-slate-900">物理計算チェック (?debug=1)</span>
        <span
          className={`font-mono-num font-semibold ${
            result.allPassed ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {result.allPassed ? 'PASS' : 'FAIL'}
        </span>
      </div>
      <ul className="space-y-1.5">
        {result.checks.map((item) => (
          <li key={item.id} className="space-y-0.5">
            <div className="flex items-start gap-1.5">
              <span className={item.passed ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                {item.passed ? '✓' : '✗'}
              </span>
              <span className="text-slate-800 font-medium">{item.label}</span>
            </div>
            <div className="pl-4 font-mono-num text-[11px] text-slate-500">{item.detail}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
};
