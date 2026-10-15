import { Sparkles } from 'lucide-react';

export function ResultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Scanning status indicator */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs">
        <Sparkles className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Scanning threat vectors, deceptive indicators & evaluating risk model...</span>
      </div>

      {/* Gauge Placeholder - 144px Fibonacci Circle */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 material-elevation-2 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="w-[144px] h-[144px] rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
        <div className="flex-1 space-y-3 w-full">
          <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-6 w-52 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-4 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70"></div>
        </div>
      </div>

      {/* Breakdown Placeholder */}
      <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 material-elevation-1">
        <div className="h-5 w-48 rounded-full bg-slate-200 dark:bg-slate-800"></div>
      </div>

      {/* Highlights Placeholder */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 material-elevation-2 space-y-4">
        <div className="h-5 w-48 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-28 w-full rounded-2xl bg-slate-100 dark:bg-slate-950/60"></div>
      </div>

      {/* Explanation Placeholder */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 material-elevation-2 space-y-4">
        <div className="h-5 w-52 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-slate-950/60"></div>
        <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-950/60"></div>
      </div>

      {/* Recommendations Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-36 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"></div>
        <div className="h-36 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"></div>
        <div className="h-36 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"></div>
      </div>
    </div>
  );
}
