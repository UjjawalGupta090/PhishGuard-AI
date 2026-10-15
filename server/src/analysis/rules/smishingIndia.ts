import { RuleMatch } from './types.js';
import { SMISHING_INDIA_PATTERNS } from './patterns.js';

export function checkSmishingIndia(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < SMISHING_INDIA_PATTERNS.length; i++) {
    const item = SMISHING_INDIA_PATTERNS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `smishing-in-${i}-${match.index}`,
        category: 'smishing_india',
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
