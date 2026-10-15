import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Sparkles, Scale, AlertOctagon } from 'lucide-react';
import { ScoreBreakdown } from '../types/contract';

interface ScoreBreakdownPanelProps {
  breakdown: ScoreBreakdown;
  aiAvailable: boolean;
}

export function ScoreBreakdownPanel({ breakdown, aiAvailable }: ScoreBreakdownPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900/70 overflow-hidden material-elevation-1 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors material-state-layer cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Scale className="w-4 h-4" />
          </div>
          <span>How we scored this (Score Breakdown)</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <span className="font-mono font-bold text-[13px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-800 dark:text-slate-200">
            Final: {breakdown.finalScore}/100
          </span>
          <div className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-4 text-xs animate-material-fade">
          {/* Adversarial Urgency Decoupled Banner */}
          {breakdown.urgencyDecoupled && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-emerald-800 dark:text-emerald-300">
              <Scale className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-bold text-[13px]">Adversarial Analysis Active: Urgency Decoupled</p>
                <p className="text-[12px] mt-0.5 text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Time-sensitive or urgent wording was identified, but due to the complete absence of definitive phishing payloads (no credential harvesting, no scam links, and no spoofing), the message was preserved as safe.
                </p>
              </div>
            </div>
          )}

          {/* Safety floor alert if triggered */}
          {breakdown.floorApplied && !breakdown.urgencyDecoupled && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-300">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-bold text-[13px]">Critical Pattern Safety Floor Overruled Score</p>
                <p className="text-[12px] mt-0.5 text-rose-700 dark:text-rose-400">
                  {breakdown.floorApplied}
                </p>
              </div>
            </div>
          )}

          {/* Evidence Classification Counts */}
          {(typeof breakdown.definitiveProofCount === 'number' || typeof breakdown.suspiciousIndicatorCount === 'number') && (
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Definitive Malicious Proof:</span>
                <span className={`font-mono font-black px-2 py-0.5 rounded-full text-xs ${
                  (breakdown.definitiveProofCount || 0) > 0 ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                }`}>
                  {breakdown.definitiveProofCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Suspicious / Contextual Cues:</span>
                <span className="font-mono font-black px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {breakdown.suspiciousIndicatorCount || 0}
                </span>
              </div>
            </div>
          )}

          {/* Dual Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Deterministic Rule Engine Score */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-2 material-elevation-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  Deterministic Rules (60%)
                </span>
                <span className="font-mono font-extrabold text-[15px] text-slate-900 dark:text-slate-100">
                  {breakdown.ruleScore} / 100
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Calculated via Noisy-OR probability combination: 100 × (1 - ∏(1 - wᵢ)) across matched indicators.
              </p>
            </div>

            {/* AI Model Contextual Score */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-2 material-elevation-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Gemini LLM Semantics (40%)
                </span>
                <span className="font-mono font-extrabold text-[15px] text-slate-900 dark:text-slate-100">
                  {aiAvailable && breakdown.llmScore !== null ? `${breakdown.llmScore} / 100` : 'Offline (N/A)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {aiAvailable
                  ? 'Contextual assessment of intent, tone, social engineering pressure, and coherence.'
                  : 'LLM unavailable; system automatically fell back to 100% deterministic rules.'}
              </p>
            </div>
          </div>

          {/* Fusion formula formula explain */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 font-mono text-[11px] text-slate-700 dark:text-slate-300">
            <span className="font-bold text-blue-700 dark:text-blue-300">Fusion Formula: </span>
            {aiAvailable && breakdown.llmScore !== null ? (
              <span>
                round(0.6 × {breakdown.ruleScore} + 0.4 × {breakdown.llmScore}) = {breakdown.finalScore}
              </span>
            ) : (
              <span>finalScore = ruleScore ({breakdown.ruleScore}) [Pure Rules Mode]</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
