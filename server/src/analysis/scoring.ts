import { Indicator, RiskLevel, ScoreBreakdown } from '../types/contract.js';

export function isDefinitiveProofIndicator(ind: Indicator): boolean {
  if (ind.nature === 'definitive_proof') return true;
  return [
    'credential_request',
    'link_risk',
    'sender_spoofing',
    'attachment_lure',
    'smishing_india',
    'financial_lure',
  ].includes(ind.category);
}

export function calculateRuleScore(indicators: Indicator[]): number {
  if (!indicators || indicators.length === 0) return 0;

  const hasDefinitive = indicators.some(isDefinitiveProofIndicator);

  // Noisy-OR combination: 1 - Product(1 - w_i)
  let nonDetectionProb = 1.0;
  for (const ind of indicators) {
    const weight = Math.max(0, Math.min(0.99, ind.weight));
    nonDetectionProb *= (1 - weight);
  }

  const rawScore = 100 * (1 - nonDetectionProb);
  const rounded = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Adversarial Invariant: If no definitive proof exists, cap ruleScore at 28 (Low Risk)
  if (!hasDefinitive && rounded >= 30) {
    return 28;
  }

  return rounded;
}

export function classifyScore(score: number): RiskLevel {
  if (score >= 65) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export interface FusionOptions {
  indicators: Indicator[];
  llmScore?: number | null;
  aiAvailable: boolean;
}

export interface FusionResult {
  finalScore: number;
  riskLevel: RiskLevel;
  scoreBreakdown: ScoreBreakdown;
  hasDefinitiveProof: boolean;
}

export function fuseScores({
  indicators,
  llmScore = null,
  aiAvailable,
}: FusionOptions): FusionResult {
  const ruleScore = calculateRuleScore(indicators);
  const weights = indicators.map((i) => i.weight);

  // Classify indicators into definitive proof vs suspicious cues
  const definitiveCount = indicators.filter(isDefinitiveProofIndicator).length;
  const suspiciousCount = indicators.length - definitiveCount;
  const hasDefinitiveProof = definitiveCount > 0;

  let preliminaryScore = ruleScore;
  let activeLlmScore: number | null = null;

  if (aiAvailable && typeof llmScore === 'number' && !isNaN(llmScore)) {
    const clampedLlmScore = Math.min(100, Math.max(0, Math.round(llmScore)));
    activeLlmScore = clampedLlmScore;
    preliminaryScore = Math.round(0.6 * ruleScore + 0.4 * clampedLlmScore);
  }

  let finalScore = preliminaryScore;
  let floorApplied: string | null = null;
  let urgencyDecoupled = false;

  // Safety floor 1: Credential Request + (Link Risk OR Urgency) => Floor 70
  const hasCredential = indicators.some((i) => i.category === 'credential_request');
  const hasLinkRisk = indicators.some((i) => i.category === 'link_risk');
  const hasUrgency = indicators.some((i) => i.category === 'urgency');

  if (hasCredential && (hasLinkRisk || hasUrgency)) {
    if (finalScore < 70) {
      finalScore = 70;
      floorApplied = 'Safety Floor Applied: Credential Harvest with Urgency/Link Combo (Minimum 70)';
    }
  }

  // Safety floor 2: Dangerous Attachment / Macro => Floor 60
  const hasDangerousAttachment = indicators.some(
    (i) => i.category === 'attachment_lure' && (i.weight >= 0.8 || /macro|dangerous/i.test(i.reason))
  );

  if (hasDangerousAttachment) {
    if (finalScore < 60) {
      finalScore = 60;
      floorApplied = floorApplied
        ? `${floorApplied} | Attachment Payload Floor (60)`
        : 'Safety Floor Applied: Dangerous Attachment or Macro Payload (Minimum 60)';
    }
  }

  // Adversarial Invariant: Urgency Decoupling & The Definitive Proof Requirement
  // If NO definitive proof was discovered (no credential harvesting, no scam links, no dangerous attachments, no sender spoofing),
  // then urgency alone does NOT imply phishing. Cap score at 28 (Low Risk).
  if (!hasDefinitiveProof) {
    if (finalScore >= 30) {
      finalScore = Math.min(28, finalScore);
      urgencyDecoupled = true;
      floorApplied = floorApplied
        ? `${floorApplied} | Urgency Decoupled: Lack of definitive payload preserves Low Risk`
        : 'Adversarial Defense: Urgency decoupled from phishing verdict; lack of definitive payload preserves Low Risk';
    } else if (hasUrgency) {
      urgencyDecoupled = true;
    }
  }

  const riskLevel = classifyScore(finalScore);

  return {
    finalScore,
    riskLevel,
    scoreBreakdown: {
      ruleScore,
      llmScore: activeLlmScore,
      finalScore,
      floorApplied,
      weights,
      definitiveProofCount: definitiveCount,
      suspiciousIndicatorCount: suspiciousCount,
      urgencyDecoupled,
    },
    hasDefinitiveProof,
  };
}
