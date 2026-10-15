import { RuleMatch } from './types.js';
import { FREE_MAIL_PROVIDERS, PROTECTED_BRANDS } from './patterns.js';

export function checkSenderSpoofing(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  // Match From: headers (e.g. From: "Microsoft Support" <alert@gmail.com> or From: alert@gmail.com)
  const fromRegex = /\bFrom:\s*(?:["']?([^<"\n\r]+)["']?\s*)?(?:<([^>]+)>|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}))/gi;
  // Match Reply-To: headers
  const replyToRegex = /\bReply-To:\s*(?:["']?([^<"\n\r]+)["']?\s*)?(?:<([^>]+)>|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}))/gi;

  let fromMatch: RegExpExecArray | null = fromRegex.exec(text);
  let replyToMatch: RegExpExecArray | null = replyToRegex.exec(text);

  if (fromMatch) {
    const rawMatch = fromMatch[0];
    const startIndex = fromMatch.index;
    const endIndex = startIndex + rawMatch.length;
    const displayName = (fromMatch[1] || '').trim().toLowerCase();
    const fromEmail = (fromMatch[2] || fromMatch[3] || '').trim().toLowerCase();
    const fromDomain = fromEmail.split('@')[1] || '';

    // 1. Free-mail domain claiming to be a major brand or organization
    if (FREE_MAIL_PROVIDERS.has(fromDomain)) {
      for (const brand of PROTECTED_BRANDS) {
        if (displayName.includes(brand)) {
          matches.push({
            id: `sender-freemail-brand-${startIndex}`,
            category: 'sender_spoofing',
            severity: 'high',
            weight: 0.9,
            start: startIndex,
            end: endIndex,
            matchedText: rawMatch,
            reason: `Sender display name claims to represent "${brand}" but originates from a free consumer mailbox (@${fromDomain})`,
          });
          break;
        }
      }

      // Check corporate impersonation keywords in display name with free-mail
      if (/support|security|helpdesk|billing|executive|ceo|admin|compliance/i.test(displayName)) {
        matches.push({
          id: `sender-freemail-corporate-${startIndex}`,
          category: 'sender_spoofing',
          severity: 'medium',
          weight: 0.7,
          start: startIndex,
          end: endIndex,
          matchedText: rawMatch,
          reason: `Official department persona ("${displayName}") originating from an unverified personal webmail address (@${fromDomain})`,
        });
      }
    }

    // 2. Reply-To domain differs from From domain
    if (replyToMatch) {
      const replyEmail = (replyToMatch[2] || replyToMatch[3] || '').trim().toLowerCase();
      const replyDomain = replyEmail.split('@')[1] || '';

      if (fromDomain && replyDomain && fromDomain !== replyDomain) {
        matches.push({
          id: `sender-replyto-mismatch-${replyToMatch.index}`,
          category: 'sender_spoofing',
          severity: 'high',
          weight: 0.85,
          start: replyToMatch.index,
          end: replyToMatch.index + replyToMatch[0].length,
          matchedText: replyToMatch[0],
          reason: `Reply-To destination (@${replyDomain}) silently diverts correspondence away from the claimed sender domain (@${fromDomain})`,
        });
      }
    }
  }

  return matches;
}
