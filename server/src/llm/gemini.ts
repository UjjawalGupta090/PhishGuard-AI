import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { Indicator } from '../types/contract.js';
import { geminiResponseSchema, llmOutputSchema, LlmOutput } from './schema.js';
import { SYSTEM_INSTRUCTION, buildAnalysisPrompt, generateFallbackExplanation } from './prompts.js';

function getAiClient(): GoogleGenAI | null {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}

export interface GeminiAnalysisResult {
  aiAvailable: boolean;
  llmRiskScore: number | null;
  explanation: {
    summary: string;
    attackerGoal: string;
    reasoning: string[];
    confidence: 'low' | 'medium' | 'high';
  };
  recommendations: {
    doNow: string[];
    dontDo: string[];
    reportTo: string[];
  };
  aiIndicators: Indicator[];
}

async function callGeminiRaw(prompt: string, timeoutMs: number = 15000): Promise<string> {
  const client = getAiClient();
  if (!client) {
    throw new Error('Gemini API key is not configured.');
  }

  // Model cascade: try configured model, then fallback candidates
  const modelsToTry = [env.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-3.8-flash'].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  );

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Gemini LLM request timed out after ${timeoutMs}ms on model ${model}.`));
        }, timeoutMs);
      });

      const requestPromise = client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: geminiResponseSchema,
        },
      });

      const response = await Promise.race([requestPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);

      const text = response.text;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[GEMINI] Model ${model} failed, trying candidate fallback: ${lastError.message}`);
      continue;
    }
  }

  throw lastError || new Error('All Gemini model candidates failed.');
}

export async function analyzeWithGemini(
  analyzedText: string,
  ruleIndicators: Indicator[],
  preliminaryRiskLevel: 'low' | 'medium' | 'high'
): Promise<GeminiAnalysisResult> {
  const client = getAiClient();

  // If Gemini is disabled / key not provided, degrade immediately
  if (!client) {
    const fallback = generateFallbackExplanation(preliminaryRiskLevel, ruleIndicators);
    return {
      aiAvailable: false,
      llmRiskScore: null,
      explanation: {
        summary: fallback.summary,
        attackerGoal: fallback.attackerGoal,
        reasoning: fallback.reasoning,
        confidence: fallback.confidence,
      },
      recommendations: fallback.recommendations,
      aiIndicators: [],
    };
  }

  const prompt = buildAnalysisPrompt(analyzedText, ruleIndicators);
  let parsedOutput: LlmOutput | null = null;

  // Try once, retry once if schema validation fails
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const rawText = await callGeminiRaw(prompt, 15000);
      const json = JSON.parse(rawText);
      const validated = llmOutputSchema.safeParse(json);

      if (validated.success) {
        parsedOutput = validated.data;
        break;
      } else {
        console.warn(`[GEMINI] Schema validation attempt ${attempt} failed: ${validated.error.message}`);
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown LLM error';
      console.warn(`[GEMINI] LLM call attempt ${attempt} error: ${errMessage}`);
      if (attempt === 2) break;
    }
  }

  // Graceful degradation on failure
  if (!parsedOutput) {
    const fallback = generateFallbackExplanation(preliminaryRiskLevel, ruleIndicators);
    return {
      aiAvailable: false,
      llmRiskScore: null,
      explanation: {
        summary: fallback.summary,
        attackerGoal: fallback.attackerGoal,
        reasoning: fallback.reasoning,
        confidence: fallback.confidence,
      },
      recommendations: fallback.recommendations,
      aiIndicators: [],
    };
  }

  // Verify every extraIndicators quote is an exact substring of the text
  // Prevents hallucinated highlights
  const aiIndicators: Indicator[] = [];

  for (let i = 0; i < parsedOutput.extraIndicators.length; i++) {
    const item = parsedOutput.extraIndicators[i];
    if (!item.quote || item.quote.length < 3) continue;

    const start = analyzedText.indexOf(item.quote);
    if (start !== -1) {
      const end = start + item.quote.length;
      aiIndicators.push({
        id: `ai-indicator-${i}-${start}`,
        category: 'ai_detected',
        severity: parsedOutput.verdict,
        weight: parsedOutput.llmRiskScore / 100,
        start,
        end,
        matchedText: item.quote,
        reason: item.why,
        source: 'ai',
        nature: 'suspicious_indicator',
      });
    }
    // If not found in text, quote is dropped silently
  }

  return {
    aiAvailable: true,
    llmRiskScore: parsedOutput.llmRiskScore,
    explanation: {
      summary: parsedOutput.summary,
      attackerGoal: parsedOutput.attackerGoal,
      reasoning: parsedOutput.reasoning,
      confidence: parsedOutput.confidence,
    },
    recommendations: parsedOutput.recommendations,
    aiIndicators,
  };
}
