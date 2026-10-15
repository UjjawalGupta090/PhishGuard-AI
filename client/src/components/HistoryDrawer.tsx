import { useState, type MouseEvent } from 'react';
import {
  X,
  History,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Lock,
} from 'lucide-react';
import { HistoryItem } from '../types/contract';
import { formatDate } from '../lib/utils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  isLoading: boolean;
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => Promise<unknown>;
  onClearAll: () => Promise<unknown>;
  onOpenAuth?: () => void;
  isLoggedIn?: boolean;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  items,
  isLoading,
  onSelectItem,
  onDeleteItem,
  onClearAll,
  onOpenAuth,
  isLoggedIn = false,
}: HistoryDrawerProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!isOpen) return null;

  const toggleReveal = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shadow-2xs">
            <ShieldAlert className="w-3 h-3 text-rose-500" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Low
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-material-fade">
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 material-elevation-4 flex flex-col h-full z-10 border-l border-slate-200/80 dark:border-slate-800/80 sm:rounded-l-3xl transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-[15px]">
                Message History
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {items.length} past evaluation{items.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors material-state-layer cursor-pointer"
            aria-label="Close history drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest advisory banner */}
        {!isLoggedIn && (
          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/35 border-b border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-[12px] font-medium">Sign in to save history across devices</span>
            </div>
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="font-bold underline text-blue-600 dark:text-blue-400 text-[12px] shrink-0 cursor-pointer"
              >
                Sign in
              </button>
            )}
          </div>
        )}

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {isLoading && (
            <div className="text-center py-14 text-slate-400 text-xs font-medium">
              Loading past records...
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 w-16 h-16 mx-auto flex items-center justify-center text-slate-400">
                <Shield className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                No past analyses yet
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Paste a suspicious message on the main screen to generate your first awareness report.
              </p>
            </div>
          )}

          {!isLoading &&
            items.map((item) => {
              const isRevealed = Boolean(revealedIds[item.id]);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all cursor-pointer space-y-2.5 text-xs group material-state-layer material-elevation-1 hover:material-elevation-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRiskBadge(item.riskLevel)}
                      <span className="font-mono font-extrabold text-[13px] text-slate-800 dark:text-slate-200">
                        {item.finalScore}/100
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="flex items-center gap-1 text-[11px] font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 rounded-full transition-opacity cursor-pointer"
                        title="Delete this record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Redacted Preview with blur toggle */}
                  <div className="relative rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800/80">
                    <p
                      className={`font-mono text-[11px] text-slate-700 dark:text-slate-300 transition-all leading-relaxed ${
                        isRevealed ? '' : 'filter blur-[3.5px] select-none'
                      }`}
                    >
                      {item.redactedPreview || 'No preview text'}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => toggleReveal(item.id, e)}
                      className="absolute top-2 right-2 p-1 px-2 rounded-full bg-slate-100/90 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 text-[10px] flex items-center gap-1 font-semibold cursor-pointer material-state-layer shadow-2xs"
                      title={isRevealed ? 'Hide preview' : 'Reveal preview'}
                    >
                      {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>

                  {/* Explanation snippet */}
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.explanationSummary}
                  </p>
                </div>
              );
            })}
        </div>

        {/* Footer with Clear All and Privacy Note */}
        <div className="p-5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 space-y-3">
          {items.length > 0 && (
            <div>
              {isConfirmingClear ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={async () => {
                      await onClearAll();
                      setIsConfirmingClear(false);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs material-state-layer cursor-pointer"
                  >
                    Confirm Clear All
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="py-2.5 px-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold material-state-layer cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="w-full py-2.5 px-4 rounded-full border border-slate-300/80 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors material-state-layer cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All History</span>
                </button>
              )}
            </div>
          )}

          <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Privacy Guard: Raw message content is never stored.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
