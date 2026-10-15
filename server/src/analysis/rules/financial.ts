import { RuleMatch } from './types.js';
import { FINANCIAL_PATTERNS } from './patterns.js';

export function checkFinancialLures(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < FINANCIAL_PATTERNS.length; i++) {
    const item = FINANCIAL_PATTERNS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `financial-${i}-${match.index}`,
        category: 'financial_lure',
        severity: item.severity,
        weight: item.weight,
        start: match.index,
        end: match.index + match[0].length,
        matchedText: match[0],
        reason: item.reason,
      });
    }
  }

  return matches;
}
