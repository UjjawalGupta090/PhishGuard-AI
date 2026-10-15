import { RuleMatch } from './types.js';

const AUTHORITY_PATTERNS = [
  {
    regex: /\b(?:it\s*(?:helpdesk|support|department|admin|service\s*desk)|system\s*administrator)\b/gi,
    severity: 'medium' as const,
    weight: 0.6,
    reason: 'Impersonates internal IT Helpdesk or System Administration',
  },
  {
    regex: /\b(?:human\s*resources|hr\s*(?:department|payroll|team)?|\bhr\b|benefits\s*team)\b/gi,
    severity: 'medium' as const,
    weight: 0.55,
    reason: 'Impersonates Human Resources or corporate payroll department',
  },
  {
    regex: /\b(?:chief\s*executive\s*officer|ceo|managing\s*director|executive\s*(?:office|board)|board\s*of\s*directors)\b/gi,
    severity: 'medium' as const,
    weight: 0.65,
    reason: 'Invokes corporate executive authority to intimidate or bypass policy',
  },
  {
    regex: /\b(?:income\s*tax\s*department|internal\s*revenue\s*service|irs|tax\s*authority|rbi|reserve\s*bank\s*of\s*india)\b/gi,
    severity: 'high' as const,
    weight: 0.75,
    reason: 'Impersonates statutory financial or revenue regulatory authority',
  },
  {
    regex: /\b(?:fedex|dhl|ups|indiapost|blue\s*dart|amazon\s*logistics)\s*(?:delivery|shipment|courier|dispatch)\b/gi,
    severity: 'medium' as const,
    weight: 0.6,
    reason: 'Impersonates major logistics or courier services',
  },
  {
    regex: /\b(?:microsoft\s*(?:365|security|support|team)|google\s*(?:workspace|security|account)|apple\s*support)\b/gi,
    severity: 'medium' as const,
    weight: 0.6,
    reason: 'Impersonates global technology platform support or cloud administration',
  },
];

export function checkAuthority(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (let i = 0; i < AUTHORITY_PATTERNS.length; i++) {
    const item = AUTHORITY_PATTERNS[i];
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `authority-${i}-${match.index}`,
        category: 'authority_impersonation',
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
