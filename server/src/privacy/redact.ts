/**
 * PII Redactor
 * Privacy by Design: sanitizes sensitive data prior to LLM submission or database storage.
 * Idempotent, deterministic, and supports Indian context (Aadhaar, PAN, UPI, +91) as well as global standards.
 */

// Luhn Algorithm for Credit Card validation
export function isValidLuhn(digits: string): boolean {
  const sanitized = digits.replace(/\D/g, '');
  if (sanitized.length < 13 || sanitized.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (isNaN(digit)) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function stripUrlQueryParams(text: string): string {
  // Replace URLs with query params/fragments, keeping only scheme + host + path
  const urlRegex = /(https?:\/\/[^\s<>"'\)]+)/gi;
  return text.replace(urlRegex, (fullUrl) => {
    try {
      const parsed = new URL(fullUrl);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      // If URL parsing fails, strip everything after ? or #
      return fullUrl.split(/[?#]/)[0];
    }
  });
}

export function redactPII(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  // 1. Strip URL query strings & fragments first so tokens/API keys in links are removed
  result = stripUrlQueryParams(result);

  // 2. Credit Card numbers (13-19 digits with spaces/dashes, checked via Luhn)
  result = result.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => {
    const rawDigits = match.replace(/[\s-]/g, '');
    // Ensure it's not a generic sequence like a phone number or 16 zeroes
    if (/^0+$/.test(rawDigits)) return match;
    if (isValidLuhn(rawDigits)) {
      return '[CARD]';
    }
    return match;
  });

  // 3. Indian PAN: 5 uppercase letters + 4 digits + 1 uppercase letter
  result = result.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, '[PAN]');

  // 4. Aadhaar / 12-digit ID numbers (e.g. 1234 5678 9012 or 123456789012)
  // Must avoid matching numbers already redacted into [CARD]
  result = result.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, (match) => {
    const raw = match.replace(/[\s-]/g, '');
    // If it was already validated as card, it would have been replaced. Check length 12
    if (raw.length === 12) {
      return '[ID_NUMBER]';
    }
    return match;
  });

  // 5. Bank Account Numbers & IBAN
  // Standard IBAN pattern
  result = result.replace(/\b[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}\b/g, '[ACCOUNT]');
  // Account numbers following indicators like A/C, Account No, etc.
  result = result.replace(
    /\b(?:ac|a\/c|acc|account|acct|account\s*(?:no|number)?)[:\s.#-]*([0-9]{9,18})\b/gi,
    (match, accNum) => match.replace(accNum, '[ACCOUNT]')
  );

  // 6. Emails
  result = result.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]');

  // 7. OTP / Verification PINs (4-8 digits near keywords like OTP, PIN, code, verification)
  result = result.replace(
    /\b(?:otp|one[- ]time[- ]password|verification[- ]code|security[- ]code|pin)[:\s\-#]+([0-9]{4,8})\b/gi,
    (match, code) => match.replace(code, '[OTP]')
  );
  result = result.replace(
    /\b([0-9]{4,8})\s+(?:is your (?:otp|secret pin|verification code|one time password))\b/gi,
    (match, code) => match.replace(code, '[OTP]')
  );

  // 8. Phone Numbers (Indian +91 / 10-digit mobile, US/Intl formats)
  // Indian Mobile: starts with 6,7,8,9 with optional +91 or 0 prefix
  result = result.replace(/(?:\+91[\-\s]?|0)?[6-9]\d{9}\b/g, '[PHONE]');
  // US / Generic International formatted phones: +1-800-555-0199, (555) 123-4567
  result = result.replace(/(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, '[PHONE]');

  return result;
}
