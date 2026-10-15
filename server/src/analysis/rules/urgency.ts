import { RuleMatch } from './types.js';
import { URGENCY_PATTERNS } from './patterns.js';

export function checkUrgency(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < URGENCY_PATTERNS.length; i++) {
    const item = URGENCY_PATTERNS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `urgency-${i}-${match.index}`,
        category: 'urgency',
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
