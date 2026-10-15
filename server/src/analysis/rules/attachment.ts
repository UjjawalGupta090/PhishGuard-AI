import { RuleMatch } from './types.js';
import { DANGEROUS_EXTENSIONS } from './patterns.js';

export function checkAttachments(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  // 1. Dangerous file extensions (e.g. invoice.zip, payment.exe, document.html, macro-enabled docs)
  const extGroup = DANGEROUS_EXTENSIONS.map((e) => e.replace('.', '\\.')).join('|');
  const extRegex = new RegExp(`\\b([\\w-]+\\.(?:${extGroup}))\\b`, 'gi');
  let match: RegExpExecArray | null;

  while ((match = extRegex.exec(text)) !== null) {
    matches.push({
      id: `attachment-ext-${match.index}`,
      category: 'attachment_lure',
      severity: 'high',
      weight: 0.85,
      start: match.index,
      end: match.index + match[0].length,
      matchedText: match[0],
      reason: `Dangerous attachment payload (${match[0]}) frequently used to deliver malware or HTML phishing forms`,
    });
  }

  // 2. Enable macro prompts
  const macroRegex = /\b(?:enable\s+(?:macros|content|editing)|macros\s+must\s+be\s+enabled)\b/gi;
  while ((match = macroRegex.exec(text)) !== null) {
    matches.push({
      id: `attachment-macro-${match.index}`,
      category: 'attachment_lure',
      severity: 'high',
      weight: 0.9,
      start: match.index,
      end: match.index + match[0].length,
      matchedText: match[0],
      reason: 'Urges recipient to enable macros, facilitating execution of malicious document scripts',
    });
  }

  // 3. Generic attachment lure phrases
  const lureRegex = /\b(?:see\s+attached\s+(?:invoice|receipt|document|file|report)|find\s+attached\s+(?:invoice|bill))\b/gi;
  while ((match = lureRegex.exec(text)) !== null) {
    matches.push({
      id: `attachment-lure-${match.index}`,
      category: 'attachment_lure',
      severity: 'medium',
      weight: 0.5,
      start: match.index,
      end: match.index + match[0].length,
      matchedText: match[0],
      reason: 'References an unexpected or unsolicited invoice/billing attachment',
    });
  }

  return matches;
}
