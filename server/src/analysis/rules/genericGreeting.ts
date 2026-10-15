import { RuleMatch } from './types.js';
import { GENERIC_GREETINGS } from './patterns.js';

export function checkGenericGreetings(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < GENERIC_GREETINGS.length; i++) {
    const item = GENERIC_GREETINGS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `greeting-${i}-${match.index}`,
        category: 'generic_greeting',
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
