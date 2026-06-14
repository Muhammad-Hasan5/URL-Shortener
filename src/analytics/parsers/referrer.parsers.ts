const SOCIAL = [
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
];
const SEARCH = ["google.com", "bing.com", "duckduckgo.com", "yahoo.com"];
const EMAIL = ["mail.google.com", "outlook.live.com", "mail.yahoo.com"];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseReferrer(refHeader: any) {
  if (!refHeader) return { type: "direct", domain: null, name: "Direct" };

  let domain: string;
  try {
    domain = new URL(refHeader).hostname.replace("www.", "");
  } catch {
    return { type: "unknown", domain: refHeader };
  }

  if (SOCIAL.some((s) => domain.endsWith(s)))
    return {
      type: "social",
      domain,
      name: capitalize(domain.split(".")[0] || domain),
    };
  if (SEARCH.some((s) => domain.endsWith(s)))
    return {
      type: "search",
      domain,
      name: capitalize(domain.split(".")[0] || domain),
    };
  if (EMAIL.some((s) => domain.endsWith(s)))
    return { type: "email", domain, name: "Email" };

  return { type: "website", domain, name: domain };
}
