export type RiskLevel = 'low' | 'medium' | 'high';
export type IndicatorSeverity = 'low' | 'medium' | 'high';
export type IndicatorSource = 'rule' | 'ai';
export type IndicatorNature = 'definitive_proof' | 'suspicious_indicator';
export type ChannelGuess = 'email' | 'sms' | 'chat' | 'unknown';

export type IndicatorCategory =
  | 'urgency'
  | 'credential_request'
  | 'financial_lure'
  | 'authority_impersonation'
  | 'threat_or_fear'
  | 'generic_greeting'
  | 'attachment_lure'
  | 'link_risk'
  | 'sender_spoofing'
  | 'smishing_india'
  | 'emotional_manipulation'
  | 'ai_detected';

export interface Indicator {
  id: string;
  category: IndicatorCategory;
  severity: IndicatorSeverity;
  weight: number;
  start: number;
  end: number;
  matchedText: string;
  reason: string;
  source: IndicatorSource;
  nature: IndicatorNature;
}

export interface ScoreBreakdown {
  ruleScore: number;
  llmScore: number | null;
  finalScore: number;
  floorApplied: string | null;
  weights: number[];
  definitiveProofCount?: number;
  suspiciousIndicatorCount?: number;
  urgencyDecoupled?: boolean;
}

export interface Explanation {
  summary: string;
  attackerGoal: string;
  reasoning: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface Recommendations {
  doNow: string[];
  dontDo: string[];
  reportTo: string[];
}

export interface AnalyzeRequest {
  text: string;
  redact?: boolean;
}

export interface AnalyzeResponse {
  id: string;
  riskLevel: RiskLevel;
  finalScore: number;
  scoreBreakdown: ScoreBreakdown;
  indicators: Indicator[];
  explanation: Explanation;
  recommendations: Recommendations;
  aiAvailable: boolean;
  channelGuess: ChannelGuess;
  seenBefore: boolean;
  createdAt: string;
  redactedPreview?: string;
  hasDefinitiveProof?: boolean;
}

export interface HistoryIndicatorSummary {
  category: string;
  severity: IndicatorSeverity;
  count: number;
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  riskLevel: RiskLevel;
  finalScore: number;
  indicatorSummary: HistoryIndicatorSummary[];
  redactedPreview: string;
  explanationSummary: string;
  aiAvailable: boolean;
  channelGuess: ChannelGuess;
}

export interface HistoryResponse {
  records: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  llmConfigured: boolean;
}
