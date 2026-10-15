import { RuleMatch } from './types.js';
import { CREDENTIAL_PATTERNS } from './patterns.js';

export function checkCredentials(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < CREDENTIAL_PATTERNS.length; i++) {
    const item = CREDENTIAL_PATTERNS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `credential-${i}-${match.index}`,
        category: 'credential_request',
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
