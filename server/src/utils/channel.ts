import { ChannelGuess } from '../types/contract.js';

export function guessChannel(text: string): ChannelGuess {
  if (!text) return 'unknown';

  const lower = text.toLowerCase();

  // Email indicators
  if (
    /from:\s*|subject:\s*|reply-to:\s*|to:\s*/i.test(text) ||
    /best regards|sincerely|dear team|kind regards/i.test(text) ||
    (lower.includes('@') && lower.includes('subject'))
  ) {
    return 'email';
  }

  // SMS indicators (typically concise, short codes, carrier messages)
  if (
    text.length < 280 &&
    (/sent via sms|sms alert|text stop to unsubscribe|your code is|recharge|power supply will be|bill will be disconnected/i.test(text) ||
      /\b(?:sms|msg|text)\b/i.test(text))
  ) {
    return 'sms';
  }

  // Chat indicators (slack/whatsapp/teams/telegram mentions, casual tone)
  if (
    /whatsapp|telegram|slack|teams|dm me|ping me/i.test(text) ||
    /@\w+/.test(text)
  ) {
    return 'chat';
  }

  // Secondary check by length
  if (text.length <= 200) {
    return 'sms';
  }

  return 'email';
}
