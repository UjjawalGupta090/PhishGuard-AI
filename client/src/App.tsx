import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MessageInput } from './components/MessageInput';
import { SampleSelector } from './components/SampleSelector';
import { RiskGauge } from './components/RiskGauge';
import { ScoreBreakdownPanel } from './components/ScoreBreakdownPanel';
import { HighlightedMessage } from './components/HighlightedMessage';
import { IndicatorGroupList } from './components/IndicatorGroupList';
import { AiExplanationCard } from './components/AiExplanationCard';
import { RecommendationsCard } from './components/RecommendationsCard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ResultSkeleton } from './components/ResultSkeleton';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { useAnalysis } from './hooks/useAnalysis';
import { useHistory } from './hooks/useHistory';
import { AnalyzeResponse, HistoryItem } from './types/contract';
import { ShieldCheck, Zap, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [redact, setRedact] = useState(true);
  const [currentResult, setCurrentResult] = useState<AnalyzeResponse | null>(null);
  const [analyzedOriginalText, setAnalyzedOriginalText] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [darkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // User authentication
  const { user, openAuthModal, logout, deleteAccount } = useAuth();

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Sync dark class on html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const analysisMutation = useAnalysis();
  const history = useHistory();

  const handleAnalyze = async () => {
    if (!inputText || inputText.trim().length < 20) return;

    try {
      const [result] = await Promise.all([
        analysisMutation.mutateAsync({
          text: inputText,
          redact,
        }),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
      setCurrentResult(result);
      setAnalyzedOriginalText(inputText);

      // Trigger 1-second success prompt
      setShowSuccessToast(true);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setShowSuccessToast(false);
      }, 1000);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleClear = () => {
    setInputText('');
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setInputText(item.redactedPreview);
    setCurrentResult({
      id: item.id,
      riskLevel: item.riskLevel,
      finalScore: item.finalScore,
      scoreBreakdown: {
        ruleScore: item.finalScore,
        llmScore: item.finalScore,
        finalScore: item.finalScore,
        floorApplied: null,
        weights: [],
      },
      indicators: item.indicatorSummary.map((s, idx) => ({
        id: `hist-${idx}`,
        category: s.category as any,
        severity: s.severity,
        weight: 0.5,
        start: 0,
        end: 0,
        matchedText: s.category,
        reason: `Recorded in past analysis (${s.count} occurrence${s.count > 1 ? 's' : ''})`,
        source: 'rule',
        nature: [
          'credential_request',
          'link_risk',
          'sender_spoofing',
          'attachment_lure',
          'smishing_india',
          'financial_lure',
        ].includes(s.category)
          ? 'definitive_proof'
          : 'suspicious_indicator',
      })),
      explanation: {
        summary: item.explanationSummary,
        attackerGoal: 'Derived from historical analysis record.',
        reasoning: [
          `Historical assessment recorded on ${new Date(item.createdAt).toLocaleDateString()}.`,
          `Assigned ${item.riskLevel.toUpperCase()} risk tier with a score of ${item.finalScore}/100.`,
        ],
        confidence: 'medium',
      },
      recommendations: {
        doNow: ['Refer to the past evaluation recommendations for this message category.'],
        dontDo: ['Do not open historical links or unverified attachments.'],
        reportTo: ['IT Security / Cyber Helpdesk if actively re-encountered.'],
      },
      aiAvailable: item.aiAvailable,
      channelGuess: item.channelGuess,
      seenBefore: true,
      createdAt: item.createdAt,
      redactedPreview: item.redactedPreview,
    });
    setAnalyzedOriginalText(item.redactedPreview);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-600 selection:text-white">
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.data?.total || 0}
        userEmail={user ? user.email : null}
        onOpenAuth={() => openAuthModal('login')}
        onLogout={logout}
        onDeleteAccount={deleteAccount}
      />

      {/* 1-Second Success Prompt for Message Analysis */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out transform ${
          showSuccessToast
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-emerald-950/20 backdrop-blur-md border border-emerald-400/30">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Message analyzed successfully!</span>
        </div>
      </div>

      {/* Main Content with Fibonacci Proportions (max 1440px, 5:8 Golden Ratio Columns) */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full p-5 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-fibonacci gap-6 lg:gap-8 items-start">
          {/* Left Column: Input and Samples (5 parts - Golden Ratio) */}
          <div className="space-y-6">
            <MessageInput
              text={inputText}
              onChangeText={(val) => {
                setInputText(val);
                setSelectedSampleId(null);
              }}
              redact={redact}
              onToggleRedact={() => setRedact(!redact)}
              onAnalyze={handleAnalyze}
              onClear={() => {
                handleClear();
                setSelectedSampleId(null);
              }}
              isLoading={analysisMutation.isPending}
              error={analysisMutation.error ? analysisMutation.error.message : null}
            />

            {/* Challenge 7 Adversarial Test Cases & Samples */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 material-elevation-1">
              <SampleSelector
                onSelectSample={(sampleText) => {
                  setInputText(sampleText);
                }}
                selectedId={selectedSampleId}
              />
            </div>

            {/* Security Guarantee Callout */}
            <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 text-xs space-y-2.5 text-slate-600 dark:text-slate-400 material-elevation-1">
              <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-200 text-[13px]">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Security & Privacy Guarantee</span>
              </div>
              <p className="leading-relaxed">
                1. <strong>Deterministic Rule Safety:</strong> Evaluates urgency, typosquats, credential traps, and spoofing on the original text.
              </p>
              <p className="leading-relaxed">
                2. <strong>Zero Leakage:</strong> Emails, phones, IDs, cards, and query parameters are redacted before external LLM queries or database writes.
              </p>
            </div>
          </div>

          {/* Right Column: Results & Insights (8 parts - Golden Ratio) */}
          <div className="space-y-6">
            {analysisMutation.isPending && <ResultSkeleton />}

            {!analysisMutation.isPending && currentResult && (
              <div className="space-y-6 animate-material-fade">
                {/* 1. Golden Ratio Risk Gauge (144px / 233 scale) */}
                <RiskGauge
                  score={currentResult.finalScore}
                  level={currentResult.riskLevel}
                  channelGuess={currentResult.channelGuess}
                  seenBefore={currentResult.seenBefore}
                />

                {/* 2. Transparent Score Breakdown Accordion */}
                <ScoreBreakdownPanel
                  breakdown={currentResult.scoreBreakdown}
                  aiAvailable={currentResult.aiAvailable}
                />

                {/* 3. Original Message with Interactive Threat Markers */}
                <HighlightedMessage
                  originalText={analyzedOriginalText}
                  indicators={currentResult.indicators}
                />

                {/* 4. Categorized Warning Signs List */}
                <IndicatorGroupList indicators={currentResult.indicators} />

                {/* 5. AI Explanation Card */}
                <AiExplanationCard
                  explanation={currentResult.explanation}
                  aiAvailable={currentResult.aiAvailable}
                />

                {/* 6. Actionable Safety Recommendations & Share Warning */}
                <RecommendationsCard
                  recommendations={currentResult.recommendations}
                  riskLevel={currentResult.riskLevel}
                  summary={currentResult.explanation.summary}
                />
              </div>
            )}

            {!analysisMutation.isPending && !currentResult && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 sm:p-14 text-center material-elevation-2 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 material-elevation-1">
                  <ShieldCheck className="w-10 h-10" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    Ready to Evaluate Messages
                  </h3>
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Paste an email, SMS alert, or chat thread on the left, or pick one of our 6 one-click demo samples to instantly test detection accuracy.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left pt-3">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-1.5 material-elevation-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Hybrid Engine</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Combines 25+ deterministic pattern rules with Gemini flash LLM semantics.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-1.5 material-elevation-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Privacy Redaction</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Auto-masks cards, PAN, Aadhaar, OTPs, and emails with Luhn validation.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-1.5 material-elevation-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Zero Login Needed</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Fully functional Guest Mode with anonymous browser session history.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history.data?.records || []}
        isLoading={history.isLoading}
        onSelectItem={handleSelectHistoryItem}
        onDeleteItem={history.deleteItem}
        onClearAll={history.clearAll}
        isLoggedIn={!!user}
        onOpenAuth={() => openAuthModal('login')}
      />

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}
