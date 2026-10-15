import { useState } from 'react';
import { Indicator } from '../types/contract';
import {
  AlertTriangle,
  Clock,
  KeyRound,
  DollarSign,
  UserCheck,
  Flame,
  FileCode,
  Link2,
  Send,
  Smartphone,
  HeartHandshake,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface IndicatorGroupListProps {
  indicators: Indicator[];
}

export function IndicatorGroupList({ indicators }: IndicatorGroupListProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Group indicators by category
  const groups: Record<string, Indicator[]> = {};
  for (const ind of indicators) {
    if (!groups[ind.category]) groups[ind.category] = [];
    groups[ind.category].push(ind);
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgency':
        return <Clock className="w-4 h-4 text-rose-500" />;
      case 'credential_request':
        return <KeyRound className="w-4 h-4 text-rose-500" />;
      case 'financial_lure':
        return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'authority_impersonation':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'threat_or_fear':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'attachment_lure':
        return <FileCode className="w-4 h-4 text-amber-500" />;
      case 'link_risk':
        return <Link2 className="w-4 h-4 text-rose-500" />;
      case 'sender_spoofing':
        return <Send className="w-4 h-4 text-rose-500" />;
      case 'smishing_india':
        return <Smartphone className="w-4 h-4 text-rose-500" />;
      case 'emotional_manipulation':
        return <HeartHandshake className="w-4 h-4 text-amber-500" />;
      case 'ai_detected':
        return <Bot className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-900';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-900';
      case 'low':
      default:
        return 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-900';
    }
  };

  const categories = Object.keys(groups);

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 material-elevation-1">
        No suspicious threat indicators flagged.
      </div>
    );
  }

  const isDefinitiveProof = (category: string) => {
    return [
      'credential_request',
      'link_risk',
      'sender_spoofing',
      'attachment_lure',
      'smishing_india',
      'financial_lure',
    ].includes(category);
  };

  const definitiveCategories = categories.filter(isDefinitiveProof);
  const suspiciousCategories = categories.filter((c) => !isDefinitiveProof(c));

  const renderCategoryCard = (category: string) => {
    const items = groups[category];
    const isCollapsed = collapsedCategories[category];
    const formattedTitle = category.replace(/_/g, ' ');
    const isDefinitive = isDefinitiveProof(category);

    return (
      <div
        key={category}
        className={`border rounded-2xl overflow-hidden material-elevation-1 transition-all ${
          isDefinitive
            ? 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
            : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleCategory(category)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors material-state-layer cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
              {getCategoryIcon(category)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {formattedTitle}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {items.length}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {isDefinitive ? 'Definitive Phishing Proof' : 'Contextual / Stylistic Cue'}
              </span>
            </div>
          </div>
          <div className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {!isCollapsed && (
          <div className="p-3.5 pt-1 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60 animate-material-fade">
            {items.map((ind) => (
              <div
                key={ind.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[280px]">
                    "{ind.matchedText}"
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${getSeverityBadge(
                        ind.severity
                      )}`}
                    >
                      {ind.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      w: {ind.weight}
                    </span>
                  </div>
                </div>
                <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {ind.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 material-elevation-2 space-y-5 transition-colors">
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Identified Evidence & Threat Indicators ({indicators.length})</span>
        </h4>
        <span className="text-[11px] font-semibold text-slate-400">
          {categories.length} threat categor{categories.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      {/* Section 1: Definitive Proof of Malice */}
      {definitiveCategories.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
            <span>🚨 Definitive Proof of Malice ({definitiveCategories.length})</span>
          </div>
          <div className="space-y-2.5">
            {definitiveCategories.map(renderCategoryCard)}
          </div>
        </div>
      )}

      {/* Section 2: Contextual / Suspicious Indicators */}
      {suspiciousCategories.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            <span>⚠️ Contextual / Suspicious Cues ({suspiciousCategories.length})</span>
            {definitiveCategories.length === 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 lowercase normal-case">
                (no malicious payloads detected)
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            {suspiciousCategories.map(renderCategoryCard)}
          </div>
        </div>
      )}
    </div>
  );
}
