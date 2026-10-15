import { describe, it, expect } from 'vitest';
import { calculateRuleScore, fuseScores, classifyScore } from '../src/analysis/scoring.js';
import { runRuleEngine } from '../src/analysis/rules/index.js';
import { SAMPLE_MESSAGES } from '../src/analysis/samples.js';
import { Indicator } from '../src/types/contract.js';

describe('Scoring Engine', () => {
  describe('calculateRuleScore (Noisy-OR)', () => {
    it('returns 0 for empty indicators', () => {
      expect(calculateRuleScore([])).toBe(0);
    });

    it('combines multiple indicators monotonically without exceeding 100', () => {
      const mockIndicators: Indicator[] = [
        {
          id: '1',
          category: 'urgency',
          severity: 'high',
          weight: 0.6,
          start: 0,
          end: 10,
          matchedText: 'act now',
          reason: 'Urgent',
          source: 'rule',
        },
        {
          id: '2',
          category: 'financial_lure',
          severity: 'high',
          weight: 0.7,
          start: 15,
          end: 25,
          matchedText: 'won lottery',
          reason: 'Lure',
          source: 'rule',
        },
      ];

      // 1 - (1 - 0.6) * (1 - 0.7) = 1 - (0.4 * 0.3) = 1 - 0.12 = 0.88 => 88
      const score = calculateRuleScore(mockIndicators);
      expect(score).toBe(88);
    });
  });

  describe('Safety Floors & Fusion', () => {
    it('applies Safety Floor 70 for credential request + urgency/link', () => {
      const mockIndicators: Indicator[] = [
        {
          id: 'c1',
          category: 'credential_request',
          severity: 'high',
          weight: 0.4,
          start: 0,
          end: 10,
          matchedText: 'verify password',
          reason: 'Password',
          source: 'rule',
        },
        {
          id: 'u1',
          category: 'urgency',
          severity: 'high',
          weight: 0.3,
          start: 15,
          end: 25,
          matchedText: 'within 24 hours',
          reason: 'Deadline',
          source: 'rule',
        },
      ];

      // Raw rule score would be 100 * (1 - 0.6 * 0.7) = 58
      // But safety floor forces at least 70
      const result = fuseScores({
        indicators: mockIndicators,
        aiAvailable: false,
      });

      expect(result.finalScore).toBeGreaterThanOrEqual(70);
      expect(result.riskLevel).toBe('high');
      expect(result.scoreBreakdown.floorApplied).toContain('Safety Floor Applied: Credential Harvest');
    });

    it('fuses ruleScore and llmScore with 60/40 weighting when definitive proof is present', () => {
      const mockIndicators: Indicator[] = [
        {
          id: '1',
          category: 'link_risk',
          severity: 'medium',
          weight: 0.5,
          start: 0,
          end: 10,
          matchedText: 'http://lookalike-domain.xyz',
          reason: 'Lookalike domain',
          source: 'rule',
          nature: 'definitive_proof',
        },
      ];

      // ruleScore = 50. LLM gives 90.
      // Expected = round(0.6 * 50 + 0.4 * 90) = round(30 + 36) = 66
      const result = fuseScores({
        indicators: mockIndicators,
        llmScore: 90,
        aiAvailable: true,
      });

      expect(result.finalScore).toBe(66);
      expect(result.riskLevel).toBe('high');
      expect(result.hasDefinitiveProof).toBe(true);
    });

    it('decouples urgency alone to Low Risk when no definitive proof exists', () => {
      const mockIndicators: Indicator[] = [
        {
          id: '1',
          category: 'urgency',
          severity: 'medium',
          weight: 0.5,
          start: 0,
          end: 10,
          matchedText: 'urgent action required',
          reason: 'Urgent phrasing',
          source: 'rule',
          nature: 'suspicious_indicator',
        },
      ];

      // Even if LLM is alarmist (gives 90), urgency alone must be decoupled to Low Risk (<= 28)
      const result = fuseScores({
        indicators: mockIndicators,
        llmScore: 90,
        aiAvailable: true,
      });

      expect(result.finalScore).toBeLessThanOrEqual(28);
      expect(result.riskLevel).toBe('low');
      expect(result.scoreBreakdown.urgencyDecoupled).toBe(true);
      expect(result.hasDefinitiveProof).toBe(false);
    });

    it('falls back strictly to ruleScore if LLM is unavailable', () => {
      const mockIndicators: Indicator[] = [
        {
          id: '1',
          category: 'link_risk',
          severity: 'low',
          weight: 0.3,
          start: 0,
          end: 10,
          matchedText: 'http://insecure-http.com',
          reason: 'Insecure link',
          source: 'rule',
          nature: 'definitive_proof',
        },
      ];

      const result = fuseScores({
        indicators: mockIndicators,
        llmScore: null,
        aiAvailable: false,
      });

      expect(result.finalScore).toBe(30);
      expect(result.riskLevel).toBe('medium');
    });
  });

  describe('End-to-End Evaluation on 6 Realistic Samples', () => {
    it('classifies Bank KYC SMS as HIGH risk', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-bank-kyc')!;
      const indicators = runRuleEngine(sample.text);
      const result = fuseScores({ indicators, aiAvailable: false });
      expect(result.riskLevel).toBe('high');
      expect(result.finalScore).toBeGreaterThanOrEqual(65);
    });

    it('classifies fake Microsoft 365 email as HIGH risk', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-microsoft-expiry')!;
      const indicators = runRuleEngine(sample.text);
      const result = fuseScores({ indicators, aiAvailable: false });
      expect(result.riskLevel).toBe('high');
      expect(result.finalScore).toBeGreaterThanOrEqual(65);
    });

    it('classifies CEO gift card scam as HIGH risk', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-ceo-giftcard')!;
      const indicators = runRuleEngine(sample.text);
      const result = fuseScores({ indicators, aiAvailable: false });
      expect(result.riskLevel).toBe('high');
      expect(result.finalScore).toBeGreaterThanOrEqual(65);
    });

    it('classifies Courier customs fee SMS as MEDIUM or HIGH risk', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-courier-fee')!;
      const indicators = runRuleEngine(sample.text);
      const result = fuseScores({ indicators, aiAvailable: false });
      expect(['medium', 'high']).toContain(result.riskLevel);
      expect(result.finalScore).toBeGreaterThanOrEqual(30);
    });

    it('classifies Telegram WFH Job offer as HIGH risk', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-fake-job')!;
      const indicators = runRuleEngine(sample.text);
      const result = fuseScores({ indicators, aiAvailable: false });
      expect(result.riskLevel).toBe('high');
      expect(result.finalScore).toBeGreaterThanOrEqual(65);
    });

    it('classifies safe internal team email with "urgent meeting tomorrow" as LOW risk', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-safe-email')!;
      const indicators = runRuleEngine(sample.text);
      const result = fuseScores({ indicators, aiAvailable: false });
      expect(result.riskLevel).toBe('low');
      expect(result.finalScore).toBeLessThanOrEqual(29);
    });
  });
});
