import { Sparkles, Target, CheckCircle2 } from 'lucide-react';
import { Explanation } from '../types/contract';

interface AiExplanationCardProps {
  explanation: Explanation;
  aiAvailable: boolean;
}

export function AiExplanationCard({ explanation }: AiExplanationCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 material-elevation-2 space-y-5 transition-colors">

      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Security Analysis & Attacker Intent</span>
        </h4>
        <span
          className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs ${
            explanation.confidence === 'high'
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          {explanation.confidence} confidence
        </span>
      </div>

      {/* Primary Summary */}
      <p className="text-[13px] sm:text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        {explanation.summary}
      </p>

      {/* What the attacker wants */}
      <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide">
          <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>What the sender/attacker is seeking:</span>
        </div>
        <p className="text-[13px] text-purple-950 dark:text-purple-200 font-semibold pl-6 leading-relaxed">
          {explanation.attackerGoal}
        </p>
      </div>

      {/* Reasoning points */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Key Threat Signals:
        </label>
        <ul className="space-y-2.5">
          {explanation.reasoning.map((point, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
