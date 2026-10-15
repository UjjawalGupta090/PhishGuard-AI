import { RuleMatch } from './types.js';
import { PROTECTED_BRANDS, SUSPICIOUS_TLDS, URL_SHORTENERS } from './patterns.js';

export function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[an][bn];
}

// Check if a hostname resembles a protected brand with typosquatting/homograph
function checkBrandLookalike(hostname: string): { brand: string; reason: string } | null {
  const host = hostname.toLowerCase();
  const parts = host.split('.');
  // Look at the second-level domain name (e.g. 'paypa1-secure' in 'paypa1-secure.com')
  const labels = parts.slice(0, -1);
  const mainLabel = labels.join('-');

  for (const brand of PROTECTED_BRANDS) {
    // Exact match of brand domain is legitimate (e.g. 'paypal.com' or 'service.paypal.com')
    if (parts.length >= 2 && parts[parts.length - 2] === brand) {
      continue;
    }

    // Levenshtein distance on any label (e.g. 'paypa1' vs 'paypal' is dist 1)
    for (const label of labels) {
      const cleanLabel = label.replace(/[0-9-_]/g, (c) => {
        if (c === '1') return 'l';
        if (c === '0') return 'o';
        if (c === '5') return 's';
        return '';
      });

      const dist = levenshtein(label, brand);
      const cleanDist = levenshtein(cleanLabel, brand);

      if ((dist > 0 && dist <= 2) || (cleanDist === 0 && label !== brand)) {
        return {
          brand,
          reason: `Domain "${hostname}" typosquats protected brand "${brand}" (Levenshtein edit distance: ${dist})`,
        };
      }
    }

    // Brand embedded inside another domain (e.g. 'paypal-security-login.com' or 'verify-google-account.xyz')
    if (mainLabel.includes(brand) && !parts[parts.length - 2]?.endsWith(brand)) {
      return {
        brand,
        reason: `Domain "${hostname}" fraudulently incorporates brand "${brand}" in a deceptive subdomain or slug`,
      };
    }
  }

  return null;
}

export function checkLinks(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  // 1. Check HTML anchor tags for text vs href mismatch
  const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let anchorMatch: RegExpExecArray | null;

  while ((anchorMatch = anchorRegex.exec(text)) !== null) {
    const href = anchorMatch[1];
    const linkText = anchorMatch[2].trim();

    try {
      const hrefUrl = new URL(href);
      // If the link text itself looks like a URL, compare hostnames
      const textUrlMatch = linkText.match(/https?:\/\/([^\s\/]+)/i);
      if (textUrlMatch) {
        const textHost = textUrlMatch[1].toLowerCase();
        if (textHost !== hrefUrl.hostname.toLowerCase()) {
          matches.push({
            id: `link-mismatch-${anchorMatch.index}`,
            category: 'link_risk',
            severity: 'high',
            weight: 0.95,
            start: anchorMatch.index,
            end: anchorMatch.index + anchorMatch[0].length,
            matchedText: anchorMatch[0],
            reason: `Deceptive hyperlink: visible text points to "${textHost}" but destination resolves to "${hrefUrl.hostname}"`,
          });
        }
      }
    } catch {
      // Ignore invalid URLs in anchor href
    }
  }

  // 2. Extract standard URLs using WHATWG URL parser
  const urlRegex = /(https?:\/\/[^\s<>"'\)]+)/gi;
  let urlMatch: RegExpExecArray | null;

  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const rawUrl = urlMatch[0];
    const startIndex = urlMatch.index;
    const endIndex = startIndex + rawUrl.length;

    try {
      const parsed = new URL(rawUrl);
      const hostname = parsed.hostname.toLowerCase();

      // Check URL shortener
      if (URL_SHORTENERS.has(hostname)) {
        matches.push({
          id: `link-shortener-${startIndex}`,
          category: 'link_risk',
          severity: 'medium',
          weight: 0.65,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: `Obfuscated URL shortener (${hostname}) masks ultimate destination`,
        });
      }

      // Check IP address host (e.g. http://192.168.1.1)
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[')) {
        matches.push({
          id: `link-ip-host-${startIndex}`,
          category: 'link_risk',
          severity: 'high',
          weight: 0.9,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: `Raw IP address host (${hostname}) bypasses DNS reputation filtering`,
        });
      }

      // Check @ in URL (userinfo trickery)
      if (rawUrl.includes('@')) {
        matches.push({
          id: `link-at-symbol-${startIndex}`,
          category: 'link_risk',
          severity: 'high',
          weight: 0.85,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: 'URL contains "@" symbol, masking true host destination via userinfo syntax',
        });
      }

      // Check Punycode / IDN homograph (xn--)
      if (hostname.includes('xn--')) {
        matches.push({
          id: `link-punycode-${startIndex}`,
          category: 'link_risk',
          severity: 'high',
          weight: 0.9,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: `Punycode domain (${hostname}) indicates potential Internationalized Domain Name (IDN) homograph attack`,
        });
      }

      // Check excessive subdomains
      const subdomains = hostname.split('.');
      if (subdomains.length >= 5) {
        matches.push({
          id: `link-excessive-subdomains-${startIndex}`,
          category: 'link_risk',
          severity: 'medium',
          weight: 0.6,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: `Excessive subdomain nesting (${hostname}) commonly used to disguise malicious destinations`,
        });
      }

      // Check suspicious TLDs
      const tld = subdomains[subdomains.length - 1];
      if (SUSPICIOUS_TLDS.has(tld)) {
        matches.push({
          id: `link-suspicious-tld-${startIndex}`,
          category: 'link_risk',
          severity: 'medium',
          weight: 0.65,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: `Suspicious top-level domain (.${tld}) with disproportionately high abuse/phishing incidence`,
        });
      }

      // Check lookalike brand domains
      const lookalike = checkBrandLookalike(hostname);
      if (lookalike) {
        matches.push({
          id: `link-lookalike-${startIndex}`,
          category: 'link_risk',
          severity: 'high',
          weight: 0.95,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: lookalike.reason,
        });
      }

      // Check non-TLS HTTP links
      if (parsed.protocol === 'http:') {
        matches.push({
          id: `link-http-insecure-${startIndex}`,
          category: 'link_risk',
          severity: 'low',
          weight: 0.4,
          start: startIndex,
          end: endIndex,
          matchedText: rawUrl,
          reason: 'Unencrypted HTTP protocol vulnerable to interception and spoofing',
        });
      }
    } catch {
      // Malformed URL
    }
  }

  return matches;
}
