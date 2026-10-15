import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { SAMPLE_MESSAGES } from '../src/analysis/samples.js';

// Mock external LLM network dependency for fast, deterministic unit testing
vi.mock('../src/llm/gemini.js', () => ({
  analyzeWithGemini: vi.fn().mockImplementation((_text: string, _rules: any[], preliminaryRiskLevel: 'low' | 'medium' | 'high') =>
    Promise.resolve({
      aiAvailable: true,
      llmRiskScore: preliminaryRiskLevel === 'high' ? 90 : 15,
      explanation: {
        summary: 'Automated test synthesized analysis.',
        attackerGoal: 'Evaluation of threat vector and deception tactics.',
        reasoning: ['Evaluated pattern rules and social engineering pressure.'],
        confidence: 'high' as const,
      },
      recommendations: {
        doNow: ['Do not click suspicious links.'],
        dontDo: ['Do not send credentials.'],
        reportTo: ['Report to security operations.'],
      },
      aiIndicators: [],
    })
  ),
}));

describe('POST /api/analyze Integration Pipeline', () => {
  const app = createApp();
  const testSessionId = 'test-session-uuid-1234';

  it('rejects input with fewer than 20 characters', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Session-Id', testSessionId)
      .send({ text: 'Too short text' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('analyzes suspicious Bank KYC message and returns high risk', async () => {
    const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-bank-kyc')!;

    const res = await request(app)
      .post('/api/analyze')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Session-Id', testSessionId)
      .send({ text: sample.text, redact: true });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.riskLevel).toBe('high');
    expect(res.body.finalScore).toBeGreaterThanOrEqual(65);
    expect(res.body.indicators.length).toBeGreaterThan(0);
    expect(res.body.explanation).toHaveProperty('summary');
    expect(res.body.recommendations).toHaveProperty('doNow');
    expect(res.body.recommendations.doNow.length).toBeGreaterThan(0);
    expect(res.headers['x-session-id']).toBe(testSessionId);
  });

  it('analyzes legitimate internal email and returns low risk', async () => {
    const safeSample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-safe-email')!;

    const res = await request(app)
      .post('/api/analyze')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Session-Id', testSessionId)
      .send({ text: safeSample.text, redact: true });

    expect(res.status).toBe(200);
    expect(res.body.riskLevel).toBe('low');
    expect(res.body.finalScore).toBeLessThanOrEqual(29);
  });

  it('handles GET /api/history gracefully when database is offline or empty', async () => {
    const res = await request(app)
      .get('/api/history')
      .set('X-Session-Id', testSessionId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('records');
    expect(Array.isArray(res.body.records)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('handles DELETE /api/history to clear current session', async () => {
    const res = await request(app)
      .delete('/api/history')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Session-Id', testSessionId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deletedCount');
  });
});
