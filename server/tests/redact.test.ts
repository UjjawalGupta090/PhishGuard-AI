import { describe, it, expect } from 'vitest';
import { redactPII, isValidLuhn, stripUrlQueryParams } from '../src/privacy/redact.js';

describe('PII Redactor', () => {
  describe('isValidLuhn', () => {
    it('validates genuine credit card numbers', () => {
      // Standard 15-digit Amex and 16-digit Visa/Mastercard test vectors
      expect(isValidLuhn('4532015112830366')).toBe(true);
      expect(isValidLuhn('378282246310005')).toBe(true);
      expect(isValidLuhn('1234567812345670')).toBe(true);
      expect(isValidLuhn('4532015112830367')).toBe(false);
      expect(isValidLuhn('1234567812345678')).toBe(false);
    });
  });

  describe('stripUrlQueryParams', () => {
    it('strips query strings and hash fragments while preserving scheme, host, and path', () => {
      const urlWithToken = 'Visit https://bank.com/reset?token=xyz123&user=john#section2 for help';
      const stripped = stripUrlQueryParams(urlWithToken);
      expect(stripped).toBe('Visit https://bank.com/reset for help');
    });
  });

  describe('redactPII', () => {
    it('redacts email addresses to [EMAIL]', () => {
      const input = 'Contact john.doe@secure-corp.com or support@paypal.com immediately.';
      const output = redactPII(input);
      expect(output).toBe('Contact [EMAIL] or [EMAIL] immediately.');
    });

    it('redacts Indian mobile numbers and international numbers to [PHONE]', () => {
      const input = 'Call our helpdesk at +91 9876543210 or +1 (555) 234-5678 today.';
      const output = redactPII(input);
      expect(output).toContain('[PHONE]');
      expect(output).not.toContain('9876543210');
    });

    it('redacts Indian PAN numbers to [PAN]', () => {
      const input = 'Verify your Income Tax record for PAN ABCDE1234F right now.';
      const output = redactPII(input);
      expect(output).toBe('Verify your Income Tax record for PAN [PAN] right now.');
    });

    it('redacts 12-digit Aadhaar numbers to [ID_NUMBER]', () => {
      const input = 'Aadhaar update required for 1234 5678 9012 without delay.';
      const output = redactPII(input);
      expect(output).toBe('Aadhaar update required for [ID_NUMBER] without delay.');
    });

    it('redacts OTP and security codes near trigger words to [OTP]', () => {
      const input = 'Your OTP: 839201 is valid for 10 minutes. Do not share your verification code: 492012.';
      const output = redactPII(input);
      expect(output).toContain('[OTP]');
      expect(output).not.toContain('839201');
      expect(output).not.toContain('492012');
    });

    it('redacts credit card numbers passing Luhn test to [CARD]', () => {
      const input = 'Please refund to card 4532-0151-1283-0366 or 1234 5678 1234 5670.';
      const output = redactPII(input);
      expect(output).toContain('[CARD]');
      expect(output).not.toContain('4532');
    });

    it('redacts bank account numbers and IBAN to [ACCOUNT]', () => {
      const input = 'Transfer fee to account no: 987654321012 or IBAN GB82WEST12345698765432.';
      const output = redactPII(input);
      expect(output).toContain('[ACCOUNT]');
      expect(output).not.toContain('987654321012');
    });

    it('is strictly idempotent', () => {
      const message =
        'Dear user john@example.com, verify PAN ABCDE1234F with OTP: 981242 at https://site.com/login?token=abc';
      const firstPass = redactPII(message);
      const secondPass = redactPII(firstPass);
      expect(secondPass).toBe(firstPass);
    });
  });
});
