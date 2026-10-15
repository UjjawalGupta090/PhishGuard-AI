/**
 * Pattern dictionary and reference data for Phishing Rule Engine.
 * Phrase lists, brand names, shorteners, and suspicious TLDs.
 */

export const PROTECTED_BRANDS = [
  'paypal',
  'microsoft',
  'google',
  'amazon',
  'apple',
  'netflix',
  'sbi',
  'hdfc',
  'icici',
  'paytm',
  'phonepe',
  'axisbank',
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'dropbox',
  'adobe',
  'chase',
  'wellsfargo',
  'binance',
  'coinbase',
  'telegram',
  'whatsapp',
  'flipkart',
] as const;

export const SUSPICIOUS_TLDS = new Set([
  'zip',
  'mov',
  'top',
  'xyz',
  'click',
  'support',
  'work',
  'loan',
  'racing',
  'download',
  'party',
  'gq',
  'cf',
  'tk',
  'ml',
  'ga',
  'rest',
  'link',
  'bar',
  'surf',
]);

export const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'buff.ly',
  'ow.ly',
  'goo.gl',
  'rebrand.ly',
  'rb.gy',
  'bit.do',
  'cutt.ly',
  'shorturl.at',
]);

export const FREE_MAIL_PROVIDERS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'mail.com',
  'gmx.com',
  'icloud.com',
]);

export const DANGEROUS_EXTENSIONS = [
  '.zip',
  '.exe',
  '.html',
  '.iso',
  '.scr',
  '.docm',
  '.xlsm',
  '.vbs',
  '.bat',
  '.cmd',
  '.js',
  '.hta',
  '.apk',
  '.img',
  '.vhd',
];

export const URGENCY_PATTERNS = [
  {
    regex: /\b(?:immediately|act now|last warning|final notice|without delay|action required immediately)\b/gi,
    severity: 'low' as const,
    weight: 0.18,
    reason: 'Demands immediate action with urgent wording (contextual cue)',
  },
  {
    regex: /\b(?:within\s+(?:24|12|48|2|6)\s*(?:hours|hrs|minutes|mins)|in the next\s+\d+\s*(?:hours|minutes))\b/gi,
    severity: 'low' as const,
    weight: 0.22,
    reason: 'Time-sensitive deadline wording (contextual cue)',
  },
  {
    regex: /\b(?:account\s+will\s+be\s+(?:suspended|blocked|terminated|closed|deactivated|disabled|deleted))\b/gi,
    severity: 'medium' as const,
    weight: 0.3,
    reason: 'Alert of impending account or service status change',
  },
  {
    regex: /\b(?:your access has been restricted|immediate response required)\b/gi,
    severity: 'low' as const,
    weight: 0.2,
    reason: 'Urgent compliance language typical in operational notifications',
  },
];

export const CREDENTIAL_PATTERNS = [
  {
    regex: /\b(?:verify\s+your\s+(?:account|identity|details|security|profile))\b/gi,
    severity: 'high' as const,
    weight: 0.75,
    reason: 'Solicits account verification, a primary vector for credential theft',
  },
  {
    regex: /\b(?:confirm\s+your\s+(?:identity|password|pin|credentials|bank details|card details))\b/gi,
    severity: 'high' as const,
    weight: 0.85,
    reason: 'Requests direct confirmation of sensitive security credentials',
  },
  {
    regex: /\b(?:enter|provide|input|share|submit)\s+(?:your\s+)?(?:password|passcode|otp|one-time password|pin|cvv|security code|atm pin)\b/gi,
    severity: 'high' as const,
    weight: 0.9,
    reason: 'Direct request for high-privilege secrets or second-factor tokens',
  },
  {
    regex: /\b(?:login|log in|sign in)\s+(?:immediately\s+)?to\s+(?:avoid|restore|unlock|keep|prevent)\b/gi,
    severity: 'high' as const,
    weight: 0.8,
    reason: 'Coerces login action using threat of negative consequence',
  },
  {
    regex: /\b(?:update\s+your\s+(?:aadhaar|pan|kyc|banking|payment|card)\s+details)\b/gi,
    severity: 'high' as const,
    weight: 0.85,
    reason: 'Prompts updating statutory or financial identity records',
  },
];

export const FINANCIAL_PATTERNS = [
  {
    regex: /\b(?:gift\s*cards?|itunes\s*card|apple\s*gift\s*card|steam\s*card|amazon\s*gift\s*cards?)\b/gi,
    severity: 'high' as const,
    weight: 0.8,
    reason: 'Requests payment via untraceable consumer gift cards',
  },
  {
    regex: /\b(?:wire\s*transfer|crypto(?:currency)?\s*payment|bitcoin\s*transfer|send\s*(?:btc|eth|usdt))\b/gi,
    severity: 'high' as const,
    weight: 0.85,
    reason: 'Demands irreversible cryptocurrency or wire transfer',
  },
  {
    regex: /\b(?:you\s+have\s+won|lottery\s*winner|cash\s*prize|lucky\s*draw|unclaimed\s*prize|inheritance\s*fund)\b/gi,
    severity: 'high' as const,
    weight: 0.85,
    reason: 'Classic financial lure offering unexpected lottery or prize windfall',
  },
  {
    regex: /\b(?:invoice|payment)\s+(?:is\s+)?overdue\b/gi,
    severity: 'medium' as const,
    weight: 0.55,
    reason: 'Fake overdue invoice tactic to induce panic payment',
  },
  {
    regex: /\b(?:processing\s*fee|clearance\s*charge|release\s*fee|customs\s*duty\s*payment)\b/gi,
    severity: 'high' as const,
    weight: 0.75,
    reason: 'Advance-fee fraud requiring small upfront payment for released funds/goods',
  },
  {
    regex: /\b(?:tax\s*refund|claim\s*your\s*refund|refund\s*of\s*(?:\$|£|₹|\d))\b/gi,
    severity: 'medium' as const,
    weight: 0.65,
    reason: 'Tax refund bait designed to harvest banking or SSN/PAN credentials',
  },
];

export const THREAT_FEAR_PATTERNS = [
  {
    regex: /\b(?:legal\s*action|warrant\s*for\s*(?:your\s*)?arrest|lawsuit\s*filed|court\s*summons|police\s*complaint)\b/gi,
    severity: 'high' as const,
    weight: 0.85,
    reason: 'Uses extreme intimidation of legal arrest or criminal prosecution',
  },
  {
    regex: /\b(?:unauthorized\s*login(?:\s*detected)?|suspicious\s*activity\s*detected|security\s*alert:\s*compromised)\b/gi,
    severity: 'medium' as const,
    weight: 0.6,
    reason: 'Falsified security alert to trick recipient into reactionary login',
  },
  {
    regex: /\b(?:data\s*(?:leak|breach)|your\s*passwords?\s*have\s*been\s*exposed|we\s*recorded\s*you)\b/gi,
    severity: 'high' as const,
    weight: 0.8,
    reason: 'Extortion or blackmail tactic alleging privacy compromise',
  },
];

export const GENERIC_GREETINGS = [
  {
    regex: /\b(?:dear\s*(?:customer|user|client|account\s*holder|valued\s*member|beneficiary|taxpayer))\b/gi,
    severity: 'low' as const,
    weight: 0.3,
    reason: 'Impersonal generic greeting typical of automated mass phishing campaigns',
  },
];

export const EMOTIONAL_MANIPULATION_PATTERNS = [
  {
    regex: /\b(?:don'?t\s*tell\s*anyone|keep\s*this\s*(?:strictly\s*)?(?:confidential|secret)|do\s*not\s*discuss\s*with\s*(?:hr|colleagues|finance))\b/gi,
    severity: 'high' as const,
    weight: 0.8,
    reason: 'Enforces secrecy to circumvent organizational checks and approvals',
  },
  {
    regex: /\b(?:too\s+good\s+to\s+be\s+true|guaranteed\s+profit\s+daily|earn\s+without\s+effort|zero\s+risk\s+investment)\b/gi,
    severity: 'medium' as const,
    weight: 0.6,
    reason: 'Exploits greed with unrealistic financial promises',
  },
  {
    regex: /\b(?:i\s+need\s+a\s+quick\s+favor|are\s+you\s+at\s+your\s+desk\?|busy\s+in\s+a\s+meeting\s+can'?t\s+take\s+calls)\b/gi,
    severity: 'medium' as const,
    weight: 0.55,
    reason: 'Classic CEO impersonation pretext establishing unavailability for voice verification',
  },
];

export const SMISHING_INDIA_PATTERNS = [
  {
    regex: /\b(?:electricity\s*bill|power\s*supply)\s+(?:will\s*be\s*disconnected|due|cut\s*off)\s+(?:tonight|by\s*\d+\s*(?:pm|am|hours))\b/gi,
    severity: 'high' as const,
    weight: 0.9,
    reason: 'High-frequency Indian smishing scam threatening immediate electricity disconnection',
  },
  {
    regex: /\b(?:kyc\s*(?:is\s*)?(?:pending|expired|suspended)|update\s*(?:your\s*)?kyc\s*immediately)\b/gi,
    severity: 'high' as const,
    weight: 0.9,
    reason: 'Prevalent Indian KYC update smishing scam targeting bank and wallet users',
  },
  {
    regex: /\b(?:upi\s*collect\s*request|approve\s*collect\s*to\s*receive|enter\s*upi\s*pin\s*to\s*receive\s*money)\b/gi,
    severity: 'high' as const,
    weight: 0.95,
    reason: 'UPI collect scam: tricking victim into entering PIN when receiving funds',
  },
  {
    regex: /\b(?:courier\s*(?:customs\s*fee|parcel\s*pending|delivery\s*failed\s*pay\s*(?:rs|inr|\$|\d)))\b/gi,
    severity: 'high' as const,
    weight: 0.8,
    reason: 'Fake parcel delivery or customs smishing requiring illicit clearance payment',
  },
  {
    regex: /\b(?:work\s*from\s*home|part\s*time\s*job)(?:[\s\w,.-]{0,40})?(?:earn\s*(?:rs\.?|inr)?\s*\d+[,\d]*|like\s*youtube\s*videos)\b/gi,
    severity: 'high' as const,
    weight: 0.85,
    reason: 'Prevalent task-based WFH/Telegram investment scam',
  },
  {
    regex: /\b(?:sbi\s*yono|hdfc\s*netbanking|icici\s*imobile|paytm\s*kyc|dear\s*customer\s*your\s*sbi\s*account)\b/gi,
    severity: 'medium' as const,
    weight: 0.6,
    reason: 'Mentions prominent Indian banking or fintech brands in unverified message context',
  },
];
