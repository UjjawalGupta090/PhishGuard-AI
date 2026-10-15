import { createHash } from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { runRuleEngine } from './rules/index.js';
import { redactPII } from '../privacy/redact.js';
import { fuseScores } from './scoring.js';
import { analyzeWithGemini } from '../llm/gemini.js';
import { guessChannel } from '../utils/channel.js';
import { AnalysisRecord } from '../models/AnalysisRecord.js';
import { AnalyzeRequest, AnalyzeResponse, Indicator } from '../types/contract.js';

export const analyzeRequestSchema = z.object({
  text: z
    .string()
    .transform((val) =>
      val
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
    )
    .pipe(
      z
        .string()
        .min(20, 'Message text must be at least 20 characters long.')
        .max(8000, 'Message text cannot exceed 8,000 characters.')
    ),
  redact: z.boolean().default(true),
});

export async function processAnalysis(
  payload: AnalyzeRequest,
  sessionId: string,
  userId?: string
): Promise<AnalyzeResponse> {
  // Step A: Input validation and normalization
  const { text: cleanedText, redact } = analyzeRequestSchema.parse(payload);

  // Step B: Deterministic Rule Engine on the ORIGINAL text
  const ruleIndicators = runRuleEngine(cleanedText);

  // Step C: PII Redactor produces redacted copy (used for storage and LLM)
  const redactedText = redactPII(cleanedText);

  // Step D: LLM Analysis with Gemini
  // Default to redacted text for privacy, or use original if explicitly toggled off
  const llmText = redact ? redactedText : cleanedText;

  // Compute a preliminary risk level for fallback generation
  const preliminaryRuleResult = fuseScores({
    indicators: ruleIndicators,
    aiAvailable: false,
  });

  const llmResult = await analyzeWithGemini(
    llmText,
    ruleIndicators,
    preliminaryRuleResult.riskLevel
  );

  // Combine rule indicators and non-overlapping AI indicators
  const combinedIndicators: Indicator[] = [...ruleIndicators, ...llmResult.aiIndicators];

  // Step E: Score fusion and classification
  const fusion = fuseScores({
    indicators: combinedIndicators,
    llmScore: llmResult.llmRiskScore,
    aiAvailable: llmResult.aiAvailable,
  });

  // Channel classification
  const channelGuess = guessChannel(cleanedText);

  // Compute text hash for "seen before" detection
  const textHash = createHash('sha256').update(cleanedText).digest('hex');

  // Check if previously analyzed in this session
  let seenBefore = false;
  if (mongoose.connection.readyState === 1) {
    try {
      const existing = await AnalysisRecord.findOne({
        $or: [
          ...(userId ? [{ userId, textHash }] : []),
          { sessionId, textHash },
        ],
      }).lean();
      seenBefore = Boolean(existing);
    } catch {
      // Continue gracefully if DB query fails
    }
  }

  // Redacted preview for history (NEVER raw text)
  const redactedPreview =
    redactedText.length > 100 ? `${redactedText.slice(0, 100)}...` : redactedText;

  // Aggregate indicator summary counts
  const summaryMap = new Map<string, { category: string; severity: 'low' | 'medium' | 'high'; count: number }>();
  for (const ind of combinedIndicators) {
    const key = `${ind.category}-${ind.severity}`;
    if (!summaryMap.has(key)) {
      summaryMap.set(key, { category: ind.category, severity: ind.severity, count: 1 });
    } else {
      summaryMap.get(key)!.count += 1;
    }
  }
  const indicatorSummary = Array.from(summaryMap.values());

  // Step F: Persist privacy-safe history record
  let recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  if (mongoose.connection.readyState === 1) {
    try {
      const record = new AnalysisRecord({
        sessionId,
        ...(userId ? { userId } : {}),
        riskLevel: fusion.riskLevel,
        finalScore: fusion.finalScore,
        indicatorSummary,
        textHash,
        redactedPreview,
        explanationSummary: llmResult.explanation.summary,
        aiAvailable: llmResult.aiAvailable,
        channelGuess,
      });
      const saved = await record.save();
      recordId = saved._id.toString();
    } catch (dbErr) {
      console.warn('[DB] History record save bypassed or failed:', dbErr instanceof Error ? dbErr.message : dbErr);
    }
  }

  // Step G: Return result
  return {
    id: recordId,
    riskLevel: fusion.riskLevel,
    finalScore: fusion.finalScore,
    scoreBreakdown: fusion.scoreBreakdown,
    indicators: combinedIndicators,
    explanation: llmResult.explanation,
    recommendations: llmResult.recommendations,
    aiAvailable: llmResult.aiAvailable,
    channelGuess,
    seenBefore,
    createdAt: new Date().toISOString(),
    redactedPreview,
    hasDefinitiveProof: fusion.hasDefinitiveProof,
  };
}
