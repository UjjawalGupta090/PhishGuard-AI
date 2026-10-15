import { describe, it, expect } from 'vitest';
import { runRuleEngine } from '../src/analysis/rules/index.js';
import { checkLinks, levenshtein } from '../src/analysis/rules/linkRisk.js';
import { checkSenderSpoofing } from '../src/analysis/rules/senderSpoofing.js';
import { SAMPLE_MESSAGES } from '../src/analysis/samples.js';

describe('Phishing Rule Engine', () => {
  describe('Levenshtein distance & Lookalikes', () => {
    it('calculates string edit distance accurately', () => {
      expect(levenshtein('paypal', 'paypa1')).toBe(1);
      expect(levenshtein('google', 'g00gle')).toBe(2);
      expect(levenshtein('apple', 'apple')).toBe(0);
    });

    it('flags brand lookalike typosquatted domains', () => {
      const text = 'Log in at http://paypa1-secure.com/webscr to protect your wallet';
      const matches = checkLinks(text);
      expect(matches.some((m) => m.category === 'link_risk' && m.matchedText.includes('paypa1'))).toBe(true);
    });

    it('flags HTML anchor text vs href destination mismatches', () => {
      const text = 'Click here: <a href="http://evil-phish.xyz">https://paypal.com/login</a>';
      const matches = checkLinks(text);
      expect(matches.some((m) => m.reason.includes('Deceptive hyperlink'))).toBe(true);
    });
  });

  describe('Sender Spoofing & Headers', () => {
    it('detects free-mail address claiming to be a corporate brand', () => {
      const text = 'From: "Microsoft Support Team" <alert@gmail.com>\nSubject: Password expiring';
      const matches = checkSenderSpoofing(text);
      expect(matches.some((m) => m.category === 'sender_spoofing')).toBe(true);
    });

    it('detects mismatch between From and Reply-To domains', () => {
      const text = 'From: service@paypal.com\nReply-To: phisher@hackermail.net\nBody text';
      const matches = checkSenderSpoofing(text);
      expect(matches.some((m) => m.reason.includes('diverts correspondence'))).toBe(true);
    });
  });

  describe('Realistic Sample Evaluation', () => {
    it('detects high-risk indicators in Bank KYC SMS', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-bank-kyc')!;
      const indicators = runRuleEngine(sample.text);
      expect(indicators.length).toBeGreaterThanOrEqual(3);
      expect(indicators.some((i) => i.category === 'smishing_india' || i.category === 'urgency')).toBe(true);
      expect(indicators.some((i) => i.category === 'credential_request')).toBe(true);
    });

    it('detects high-risk indicators in Microsoft fake email', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-microsoft-expiry')!;
      const indicators = runRuleEngine(sample.text);
      expect(indicators.some((i) => i.category === 'sender_spoofing')).toBe(true);
      expect(indicators.some((i) => i.category === 'link_risk')).toBe(true);
      expect(indicators.some((i) => i.category === 'credential_request')).toBe(true);
    });

    it('detects CEO gift card fraud and secrecy manipulation', () => {
      const sample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-ceo-giftcard')!;
      const indicators = runRuleEngine(sample.text);
      expect(indicators.some((i) => i.category === 'financial_lure')).toBe(true);
      expect(indicators.some((i) => i.category === 'emotional_manipulation')).toBe(true);
      expect(indicators.some((i) => i.category === 'authority_impersonation')).toBe(true);
    });

    it('avoids false positives on normal internal email with "urgent meeting tomorrow"', () => {
      const safeSample = SAMPLE_MESSAGES.find((s) => s.id === 'sample-safe-email')!;
      const indicators = runRuleEngine(safeSample.text);
      // Legitimate business email must not trigger severe credential or threat rules
      expect(indicators.some((i) => i.category === 'credential_request')).toBe(false);
      expect(indicators.some((i) => i.category === 'threat_or_fear')).toBe(false);
      expect(indicators.some((i) => i.category === 'link_risk')).toBe(false);
      expect(indicators.some((i) => i.severity === 'high')).toBe(false);
    });
  });
});
