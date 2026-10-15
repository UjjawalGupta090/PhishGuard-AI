import { RuleMatch } from './types.js';
import { EMOTIONAL_MANIPULATION_PATTERNS } from './patterns.js';

export function checkEmotionalManipulation(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < EMOTIONAL_MANIPULATION_PATTERNS.length; i++) {
    const item = EMOTIONAL_MANIPULATION_PATTERNS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `emotional-${i}-${match.index}`,
        category: 'emotional_manipulation',
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
