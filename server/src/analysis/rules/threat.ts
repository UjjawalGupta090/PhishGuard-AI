import { RuleMatch } from './types.js';
import { THREAT_FEAR_PATTERNS } from './patterns.js';

export function checkThreats(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < THREAT_FEAR_PATTERNS.length; i++) {
    const item = THREAT_FEAR_PATTERNS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `threat-${i}-${match.index}`,
        category: 'threat_or_fear',
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
