/**
 * Deterministic, rule-based heuristics for URL risk assessment.
 * These run BEFORE the AI call and are passed to Groq as supporting evidence,
 * and also used to compute a baseline heuristic risk score.
 */

const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly',
  'rebrand.ly', 'cutt.ly', 'shorte.st', 'adf.ly', 'bl.ink', 'rb.gy', 'lnkd.in',
];

const SUSPICIOUS_KEYWORDS = [
  'login', 'verify', 'secure', 'update', 'confirm', 'account', 'bank',
  'password', 'free', 'prize', 'winner', 'urgent', 'suspend', 'limited',
  'click', 'reward', 'gift', 'billing', 'invoice', 'refund', 'unlock',
  'signin', 'security', 'alert', 'ebay', 'paypal', 'amazon', 'apple',
];

function isIPAddress(hostname) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  return ipv4Regex.test(hostname) || (hostname.includes(':') && ipv6Regex.test(hostname));
}

function hasPunycode(hostname) {
  return hostname.toLowerCase().includes('xn--');
}

function countSubdomains(hostname) {
  const parts = hostname.split('.');
  // e.g. www.example.com -> 3 parts, 1 subdomain typically (www)
  // a.b.c.example.com -> more subdomains
  return Math.max(0, parts.length - 2);
}

function analyzeURL(rawUrl) {
  const flags = [];
  let normalized = rawUrl.trim();
  let parsed;

  const usesHTTPS = /^https:\/\//i.test(normalized);
  const usesHTTP = /^http:\/\//i.test(normalized);

  if (!usesHTTPS && !usesHTTP) {
    normalized = `http://${normalized}`;
  }

  try {
    parsed = new URL(normalized);
  } catch (err) {
    return {
      valid: false,
      error: 'Malformed URL — could not be parsed',
      flags: ['Malformed or invalid URL structure'],
      heuristicRiskScore: 90,
    };
  }

  const hostname = parsed.hostname;
  let score = 0;

  // HTTPS check
  if (!usesHTTPS) {
    flags.push('Does not use HTTPS (insecure connection)');
    score += 15;
  }

  // IP address as domain
  const ipDomain = isIPAddress(hostname);
  if (ipDomain) {
    flags.push('Uses raw IP address instead of a domain name');
    score += 25;
  }

  // Punycode / homograph detection
  const punycode = hasPunycode(hostname);
  if (punycode) {
    flags.push('Domain uses punycode encoding (possible homograph/lookalike attack)');
    score += 25;
  }

  // Excessive subdomains
  const subdomainCount = countSubdomains(hostname);
  if (subdomainCount >= 3) {
    flags.push(`Excessive subdomains detected (${subdomainCount})`);
    score += 15;
  }

  // URL length
  if (normalized.length > 100) {
    flags.push('Unusually long URL (may hide malicious parameters)');
    score += 10;
  }

  // Shortener detection
  const isShortener = SHORTENER_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  if (isShortener) {
    flags.push('Uses a known URL shortener service (destination is hidden)');
    score += 15;
  }

  // Suspicious keywords
  const lowerUrl = normalized.toLowerCase();
  const matchedKeywords = SUSPICIOUS_KEYWORDS.filter((kw) => lowerUrl.includes(kw));
  if (matchedKeywords.length > 0) {
    flags.push(`Contains suspicious keyword(s): ${matchedKeywords.join(', ')}`);
    score += Math.min(20, matchedKeywords.length * 5);
  }

  // Many hyphens (common in phishing domains impersonating brands)
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    flags.push('Domain contains an unusually high number of hyphens');
    score += 10;
  }

  // '@' symbol trick
  if (normalized.includes('@')) {
    flags.push("Contains '@' symbol (can be used to obscure real destination)");
    score += 20;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    valid: true,
    normalizedUrl: normalized,
    hostname,
    usesHTTPS,
    isIPAddress: ipDomain,
    isPunycode: punycode,
    subdomainCount,
    urlLength: normalized.length,
    isShortener,
    matchedSuspiciousKeywords: matchedKeywords,
    hyphenCount,
    flags,
    heuristicRiskScore: score,
  };
}

module.exports = { analyzeURL };
