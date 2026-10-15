import { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Flag,
  Share2,
  Check,
} from 'lucide-react';
import { Recommendations, RiskLevel } from '../types/contract';

interface RecommendationsCardProps {
  recommendations: Recommendations;
  riskLevel: RiskLevel;
  summary: string;
}

export function RecommendationsCard({
  recommendations,
  riskLevel,
  summary,
}: RecommendationsCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShareWarning = async () => {
    const shareText = `⚠️ PHISHING ALERT WARNING ⚠️
Threat Level: ${riskLevel.toUpperCase()}

Summary:
${summary}

Safe Actions to Take:
${recommendations.doNow.map((d) => `• ${d}`).join('\n')}

DO NOT:
${recommendations.dontDo.map((d) => `• ${d}`).join('\n')}

Report this suspicious message to:
${recommendations.reportTo.map((r) => `• ${r}`).join('\n')}

— Verified via PhishGuard AI Awareness Tool`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 material-elevation-2 space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span>Recommended Protective Actions</span>
        </h4>

        {/* Share Warning Copy Button */}
        <button
          onClick={handleShareWarning}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700/80 transition-all material-state-layer cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied to clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-blue-500" />
              <span>Share warning with a friend</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Do Now */}
        <div className="p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/20 space-y-3 material-elevation-1">
          <div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Do Now</span>
          </div>
          <ul className="space-y-2.5 text-slate-700 dark:text-slate-300 text-[12px] leading-relaxed">
            {recommendations.doNow.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Don't Do */}
        <div className="p-5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/25 border border-rose-500/20 space-y-3 material-elevation-1">
          <div className="flex items-center gap-2 font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider text-[11px]">
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Do Not Do</span>
          </div>
          <ul className="space-y-2.5 text-slate-700 dark:text-slate-300 text-[12px] leading-relaxed">
            {recommendations.dontDo.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Report To */}
        <div className="p-5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/25 border border-blue-500/20 space-y-3 material-elevation-1">
          <div className="flex items-center gap-2 font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider text-[11px]">
            <Flag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Report To</span>
          </div>
          <ul className="space-y-2.5 text-slate-700 dark:text-slate-300 text-[12px] leading-relaxed">
            {recommendations.reportTo.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
