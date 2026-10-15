import { Indicator, IndicatorCategory, IndicatorNature } from '../../types/contract.js';
import { RuleMatch } from './types.js';
import { checkUrgency } from './urgency.js';
import { checkCredentials } from './credential.js';
import { checkFinancialLures } from './financial.js';
import { checkAuthority } from './authority.js';
import { checkThreats } from './threat.js';
import { checkGenericGreetings } from './genericGreeting.js';
import { checkAttachments } from './attachment.js';
import { checkLinks } from './linkRisk.js';
import { checkSenderSpoofing } from './senderSpoofing.js';
import { checkSmishingIndia } from './smishingIndia.js';
import { checkEmotionalManipulation } from './emotional.js';

export function getIndicatorNature(
  category: IndicatorCategory,
  _matchedText?: string,
  _reason?: string
): IndicatorNature {
  // Definitive proof represents actionable malicious vectors: credential harvest, deceptive links, malicious attachments, or spoofing
  switch (category) {
    case 'credential_request':
    case 'link_risk':
    case 'sender_spoofing':
    case 'attachment_lure':
    case 'smishing_india':
    case 'financial_lure':
      return 'definitive_proof';
    case 'urgency':
    case 'generic_greeting':
    case 'authority_impersonation':
    case 'emotional_manipulation':
    case 'threat_or_fear':
    case 'ai_detected':
    default:
      return 'suspicious_indicator';
  }
}

export function runRuleEngine(text: string): Indicator[] {
  if (!text || typeof text !== 'string') return [];

  // 1. Collect all rule matches
  const rawMatches: RuleMatch[] = [
    ...checkUrgency(text),
    ...checkCredentials(text),
    ...checkFinancialLures(text),
    ...checkAuthority(text),
    ...checkThreats(text),
    ...checkGenericGreetings(text),
    ...checkAttachments(text),
    ...checkLinks(text),
    ...checkSenderSpoofing(text),
    ...checkSmishingIndia(text),
    ...checkEmotionalManipulation(text),
  ];

  // 2. Sort by start offset ascending, then by weight descending
  rawMatches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.weight - a.weight;
  });

  // 3. Deduplicate / resolve overlapping spans to prevent nested/conflicting UI highlights
  const deduplicated: RuleMatch[] = [];
  let lastEnd = -1;

  for (const match of rawMatches) {
    // If the match does not overlap with previous accepted match
    if (match.start >= lastEnd) {
      deduplicated.push(match);
      lastEnd = match.end;
    } else {
      // Overlap detected: if current match has strictly higher weight than the previous, swap
      const prev = deduplicated[deduplicated.length - 1];
      if (prev && match.weight > prev.weight && match.end >= prev.end) {
        deduplicated.pop();
        deduplicated.push(match);
        lastEnd = match.end;
      }
    }
  }

  // 4. Map to public Indicator interface with evidence nature
  return deduplicated.map((m) => ({
    id: m.id,
    category: m.category,
    severity: m.severity,
    weight: m.weight,
    start: m.start,
    end: m.end,
    matchedText: m.matchedText,
    reason: m.reason,
    source: 'rule' as const,
    nature: m.nature || getIndicatorNature(m.category, m.matchedText, m.reason),
  }));
}
