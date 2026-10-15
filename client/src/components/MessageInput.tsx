import { Send, Shield, AlertCircle, Trash2, Loader2, Info } from 'lucide-react';

interface MessageInputProps {
  text: string;
  onChangeText: (text: string) => void;
  redact: boolean;
  onToggleRedact: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  isLoading: boolean;
  error: string | null;
}

export function MessageInput({
  text,
  onChangeText,
  redact,
  onToggleRedact,
  onAnalyze,
  onClear,
  isLoading,
  error,
}: MessageInputProps) {
  const charCount = text.length;
  const isTooShort = charCount > 0 && charCount < 20;
  const isTooLong = charCount > 8000;
  const canSubmit = charCount >= 20 && charCount <= 8000 && !isLoading;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 material-elevation-2 space-y-5 transition-colors">
      <div className="flex items-center justify-between">
        <label
          htmlFor="message-input"
          className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
        >
          <span>Evaluate Message or Email</span>
        </label>
        {text.length > 0 && (
          <button
            onClick={onClear}
            disabled={isLoading}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors material-state-layer cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          id="message-input"
          rows={8}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          disabled={isLoading}
          placeholder="Paste suspicious email headers, body text, SMS notification, or chat messages here (e.g. 'Your account will be suspended within 24 hours...')..."
          className="w-full rounded-2xl border border-slate-300/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-mono transition-all resize-y leading-relaxed"
        />

        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-2">
            {isTooShort && (
              <span className="text-amber-500 font-semibold text-[12px]">
                Need at least {20 - charCount} more character{20 - charCount > 1 ? 's' : ''}
              </span>
            )}
            {isTooLong && (
              <span className="text-rose-500 font-semibold text-[12px]">
                Exceeds limit by {charCount - 8000} characters
              </span>
            )}
          </div>
          <span
            className={`font-mono text-[11px] ${
              charCount > 8000
                ? 'text-rose-500 font-bold'
                : charCount > 7000
                ? 'text-amber-500 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {charCount.toLocaleString()} / 8,000
          </span>
        </div>
      </div>

      {/* Privacy Redaction Toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Redact sensitive data before AI analysis
              </span>
              <span
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help"
                title="Masks emails, phone numbers, credit card numbers, PAN, Aadhaar, and OTPs with [TAGS] before sending to the LLM. History storage is ALWAYS redacted."
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Protects credit cards, PAN, Aadhaar, OTPs, and phone numbers
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={redact}
            onChange={onToggleRedact}
            className="sr-only peer"
            disabled={isLoading}
          />
          <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Material FAB / Primary Action Button */}
      <button
        onClick={onAnalyze}
        disabled={!canSubmit}
        className={`w-full py-3.5 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all material-state-layer ${
          canSubmit
            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer material-elevation-2 hover:material-elevation-3 shadow-blue-600/20 active:scale-[0.985]'
            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Evaluating patterns & AI semantics...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Analyze Suspicious Message</span>
          </>
        )}
      </button>
    </div>
  );
}
