import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runRuleEngine } from '../src/analysis/rules/index.js';
import { fuseScores, calculateRuleScore } from '../src/analysis/scoring.js';
import { SAMPLE_MESSAGES } from '../src/analysis/samples.js';

// Mock external LLM dependency for fast, deterministic unit testing
vi.mock('../src/llm/gemini.js', () => ({
  analyzeWithGemini: vi.fn().mockImplementation((_text: string, _rules: any[], preliminaryRiskLevel: 'low' | 'medium' | 'high') =>
    Promise.resolve({
      aiAvailable: true,
      llmRiskScore: preliminaryRiskLevel === 'high' ? 85 : 15,
      explanation: {
        summary: 'Automated adversarial analysis test result.',
        attackerGoal: 'Evaluation of adversarial decoupling vs true threats.',
        reasoning: ['Evaluated pattern rules and social engineering pressure.'],
        confidence: 'high' as const,
      },
      recommendations: {
        doNow: ['Verify through authorized internal channels.'],
        dontDo: ['Never input passwords or credentials.'],
        reportTo: ['IT Security / SOC team.'],
      },
      aiIndicators: [],
    })
  ),
}));

describe('Challenge 7: Adversarial Message Analysis', () => {
  const app = createApp();
  const testSessionId = 'adversarial-session-1234';

  describe('Objective 1: Three Dedicated Test Messages', () => {
    it('provides three distinct adversarial test messages in samples', () => {
      const urgentBenign = SAMPLE_MESSAGES.find((s) => s.id === 'sample-adversarial-urgent-benign');
      const politePhish = SAMPLE_MESSAGES.find((s) => s.id === 'sample-adversarial-polite-phishing');
      const urgentMalicious = SAMPLE_MESSAGES.find((s) => s.id === 'sample-bank-kyc');

      expect(urgentBenign).toBeDefined();
      expect(politePhish).toBeDefined();
      expect(urgentMalicious).toBeDefined();

      expect(urgentBenign?.expectedRisk).toBe('low');
      expect(politePhish?.expectedRisk).toBe('high');
      expect(urgentMalicious?.expectedRisk).toBe('high');
    });
  });

  describe('Objective 2: Urgency Alone Does NOT Imply Phishing (Acceptance Test)', () => {
    it('classifies legitimate message with urgent wording as LOW RISK', async () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-adversarial-urgent-benign')!;

      // 1. Rule Engine evaluation
      const indicators = runRuleEngine(sample.text);
      expect(indicators.some((i) => i.category === 'urgency')).toBe(true);
      expect(indicators.some((i) => i.nature === 'definitive_proof')).toBe(false);

      // 2. Pure rule score must remain Low Risk (< 30)
      const ruleScore = calculateRuleScore(indicators);
      expect(ruleScore).toBeLessThan(30);

      // 3. Fusion score must remain Low Risk (< 30)
      const fusion = fuseScores({ indicators, aiAvailable: false });
      expect(fusion.riskLevel).toBe('low');
      expect(fusion.finalScore).toBeLessThan(30);
      expect(fusion.hasDefinitiveProof).toBe(false);
      expect(fusion.scoreBreakdown.urgencyDecoupled).toBe(true);

      // 4. End-to-end API verification
      const res = await request(app)
        .post('/api/analyze')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('X-Session-Id', testSessionId)
        .send({ text: sample.text, redact: true });

      expect(res.status).toBe(200);
      expect(res.body.riskLevel).toBe('low');
      expect(res.body.finalScore).toBeLessThan(30);
      expect(res.body.scoreBreakdown.urgencyDecoupled).toBe(true);
    });

    it('classifies extreme urgency text without payloads as LOW RISK', () => {
      const pureUrgencyText =
        'Action required immediately! This is your final notice. Please act now without delay within 24 hours. Your access will be closed tonight!';

      const indicators = runRuleEngine(pureUrgencyText);
      expect(indicators.length).toBeGreaterThan(0);
      expect(indicators.every((i) => i.nature === 'suspicious_indicator')).toBe(true);

      const fusion = fuseScores({ indicators, aiAvailable: false });
      expect(fusion.riskLevel).toBe('low');
      expect(fusion.finalScore).toBeLessThanOrEqual(28);
      expect(fusion.hasDefinitiveProof).toBe(false);
      expect(fusion.scoreBreakdown.urgencyDecoupled).toBe(true);
    });

    it('classifies polite phishing with ZERO urgency as HIGH RISK', async () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-adversarial-polite-phishing')!;

      const indicators = runRuleEngine(sample.text);
      // No urgency wording in courteous message
      expect(indicators.some((i) => i.category === 'urgency')).toBe(false);
      // Definitive proof found (lookalike domain / credential solicitation)
      expect(indicators.some((i) => i.nature === 'definitive_proof')).toBe(true);

      const fusion = fuseScores({ indicators, aiAvailable: false });
      expect(fusion.riskLevel).toBe('high');
      expect(fusion.finalScore).toBeGreaterThanOrEqual(65);
      expect(fusion.hasDefinitiveProof).toBe(true);

      // API verification
      const res = await request(app)
        .post('/api/analyze')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('X-Session-Id', testSessionId)
        .send({ text: sample.text, redact: true });

      expect(res.status).toBe(200);
      expect(res.body.riskLevel).toBe('high');
      expect(res.body.finalScore).toBeGreaterThanOrEqual(65);
    });

    it('classifies true threat with BOTH urgency and definitive proof as HIGH RISK', async () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-bank-kyc')!;

      const indicators = runRuleEngine(sample.text);
      expect(indicators.some((i) => i.category === 'urgency')).toBe(true);
      expect(indicators.some((i) => i.nature === 'definitive_proof')).toBe(true);

      const fusion = fuseScores({ indicators, aiAvailable: false });
      expect(fusion.riskLevel).toBe('high');
      expect(fusion.finalScore).toBeGreaterThanOrEqual(70);
      expect(fusion.hasDefinitiveProof).toBe(true);
    });
  });

  describe('Objective 3: Evidence Categorization', () => {
    it('accurately attaches indicator nature to all findings', () => {
      const mixedText =
        'Dear Customer, act now immediately! Verify your identity at http://sbi-kyc-fake.top/login to keep access.';
      const indicators = runRuleEngine(mixedText);

      const urgencyInd = indicators.find((i) => i.category === 'urgency');
      const credInd = indicators.find((i) => i.category === 'credential_request');
      const linkInd = indicators.find((i) => i.category === 'link_risk');

      expect(urgencyInd?.nature).toBe('suspicious_indicator');
      expect(credInd?.nature).toBe('definitive_proof');
      expect(linkInd?.nature).toBe('definitive_proof');
    });
  });
});
