import { z } from 'zod';
import { Type } from '@google/genai';

export const llmOutputSchema = z.object({
  llmRiskScore: z.number().int().min(0).max(100),
  verdict: z.enum(['low', 'medium', 'high']),
  confidence: z.enum(['low', 'medium', 'high']),
  summary: z.string().min(5).max(350),
  attackerGoal: z.string().min(5).max(200),
  reasoning: z.array(z.string()).min(2).max(6),
  extraIndicators: z
    .array(
      z.object({
        category: z.string(),
        quote: z.string().max(80),
        why: z.string().max(250),
      })
    )
    .default([]),
  recommendations: z.object({
    doNow: z.array(z.string()).min(1).max(5),
    dontDo: z.array(z.string()).min(1).max(5),
    reportTo: z.array(z.string()).min(1).max(5),
  }),
});

export type LlmOutput = z.infer<typeof llmOutputSchema>;

// Unified SDK responseSchema using official Type enum
export const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    llmRiskScore: {
      type: Type.INTEGER,
      description: 'Overall risk score between 0 (completely safe) and 100 (confirmed malicious phishing/scam)',
    },
    verdict: {
      type: Type.STRING,
      enum: ['low', 'medium', 'high'],
      description: 'Overall threat classification',
    },
    confidence: {
      type: Type.STRING,
      enum: ['low', 'medium', 'high'],
      description: 'Confidence in analysis based on clarity of signals',
    },
    summary: {
      type: Type.STRING,
      description: 'Plain-language summary of findings in at most 2 short sentences',
    },
    attackerGoal: {
      type: Type.STRING,
      description: 'What the sender aims to achieve (e.g. "Steal your Microsoft 365 login credentials")',
    },
    reasoning: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 5 short concise points explaining why this message is risky or safe',
    },
    extraIndicators: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: 'Threat category' },
          quote: { type: Type.STRING, description: 'Exact verbatim substring from the message (maximum 80 characters)' },
          why: { type: Type.STRING, description: 'Brief explanation of why this specific phrase is suspicious' },
        },
        required: ['category', 'quote', 'why'],
      },
      description: 'Specific quotes from the text exhibiting social engineering or suspicious patterns',
    },
    recommendations: {
      type: Type.OBJECT,
      properties: {
        doNow: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Immediate protective actions the user should take right now',
        },
        dontDo: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Actions the user must strictly avoid (e.g. do not click, do not reply)',
        },
        reportTo: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Entities or teams to report this message to (e.g. IT Helpdesk, Bank cyber cell)',
        },
      },
      required: ['doNow', 'dontDo', 'reportTo'],
    },
  },
  required: [
    'llmRiskScore',
    'verdict',
    'confidence',
    'summary',
    'attackerGoal',
    'reasoning',
    'extraIndicators',
    'recommendations',
  ],
};
