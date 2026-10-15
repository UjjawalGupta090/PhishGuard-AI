import { useState, type ReactNode } from 'react';
import { Indicator } from '../types/contract';
import { AlertCircle, Tag, Eye, EyeOff } from 'lucide-react';

interface HighlightedMessageProps {
  originalText: string;
  indicators: Indicator[];
}

export function HighlightedMessage({ originalText, indicators }: HighlightedMessageProps) {
  const [activeIndicator, setActiveIndicator] = useState<Indicator | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);

  // Build segments with markup
  const segments: ReactNode[] = [];
  let currentIndex = 0;

  // Filter valid indicator offsets within string boundaries and sort
  const validIndicators = [...indicators]
    .filter((ind) => ind.start >= 0 && ind.end <= originalText.length && ind.start < ind.end)
    .sort((a, b) => a.start - b.start);

  if (!showHighlights || validIndicators.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 material-elevation-2 space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Analyzed Message Content</span>
          </h4>
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors material-state-layer cursor-pointer"
          >
            {showHighlights ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showHighlights ? 'Hide highlights' : 'Show highlights'}</span>
          </button>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/80">
          {originalText}
        </div>
      </div>
    );
  }

  for (let i = 0; i < validIndicators.length; i++) {
    const ind = validIndicators[i];

    // Push plain text before current highlight
    if (ind.start > currentIndex) {
      segments.push(
        <span key={`text-${currentIndex}`}>
          {originalText.slice(currentIndex, ind.start)}
        </span>
      );
    }

    const matchedSegment = originalText.slice(ind.start, ind.end);

    const getSeverityStyles = (sev: string) => {
      switch (sev) {
        case 'high':
          return 'bg-rose-100 dark:bg-rose-950/90 text-rose-950 dark:text-rose-100 border-b-2 border-rose-500 hover:bg-rose-200 dark:hover:bg-rose-900/90 ring-1 ring-rose-300 dark:ring-rose-800/50';
        case 'medium':
          return 'bg-amber-100 dark:bg-amber-950/90 text-amber-950 dark:text-amber-100 border-b-2 border-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/90 ring-1 ring-amber-300 dark:ring-amber-800/50';
        case 'low':
        default:
          return 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-blue-100 border-b-2 border-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/90 ring-1 ring-blue-300 dark:ring-blue-800/50';
      }
    };

    segments.push(
      <mark
        key={`mark-${ind.id}-${i}`}
        tabIndex={0}
        role="button"
        aria-label={`Flagged indicator: ${ind.category}. ${ind.reason}`}
        onClick={() => setActiveIndicator(activeIndicator?.id === ind.id ? null : ind)}
        onMouseEnter={() => setActiveIndicator(ind)}
        onFocus={() => setActiveIndicator(ind)}
        className={`px-1.5 py-0.5 rounded-md cursor-pointer transition-all relative font-bold text-[12px] inline-block my-0.5 ${getSeverityStyles(
          ind.severity
        )}`}
      >
        {matchedSegment}
      </mark>
    );

    currentIndex = ind.end;
  }

  // Push remaining trailing text
  if (currentIndex < originalText.length) {
    segments.push(
      <span key={`text-end`}>{originalText.slice(currentIndex)}</span>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 material-elevation-2 space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Interactive Threat Markers</span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {validIndicators.length} flag{validIndicators.length === 1 ? '' : 's'}
          </span>
        </h4>
        <button
          onClick={() => setShowHighlights(!showHighlights)}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors material-state-layer cursor-pointer"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Toggle highlights</span>
        </button>
      </div>

      <div className="relative">
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 font-mono text-[13px] whitespace-pre-wrap leading-loose text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/80">
          {segments}
        </div>

        {/* Floating Reason Tooltip / Popover when indicator is hovered or focused */}
        {activeIndicator && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700/80 material-elevation-3 text-xs space-y-1.5 animate-material-fade">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold flex items-center gap-1.5 text-blue-400 uppercase tracking-wider text-[11px]">
                  <Tag className="w-3.5 h-3.5" />
                  {activeIndicator.category.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  activeIndicator.nature === 'definitive_proof'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {activeIndicator.nature === 'definitive_proof' ? 'Definitive Proof' : 'Contextual Cue'}
                </span>
              </div>
              <span
                className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-2xs ${
                  activeIndicator.severity === 'high'
                    ? 'bg-rose-500 text-white'
                    : activeIndicator.severity === 'medium'
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {activeIndicator.severity}
              </span>
            </div>
            <p className="text-slate-300 flex items-start gap-2 mt-1 leading-relaxed text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>{activeIndicator.reason}</span>
            </p>
          </div>
        )}
      </div>

      <p className="text-[12px] text-slate-400 flex items-center gap-1 font-medium">
        <span>💡 Hover or tap on any highlighted phrase to view specific threat diagnostics.</span>
      </p>
    </div>
  );
}
