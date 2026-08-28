export interface PlatformInfo {
  name: string;
  domain: string;
  logo: string;
}

// Logos come from Google's public favicon service rather than
// Clearbit's logo API — Clearbit is an enrichment/tracking company
// and its domain is commonly blocked by ad-blockers and privacy
// extensions (uBlock, Privacy Badger, etc.), which silently blanks
// out every logo regardless of whether the platform was detected
// correctly. Google's favicon endpoint is far less likely to be
// blocked.
const KNOWN_PLATFORMS: { match: string; name: string; domain: string }[] = [
  { match: "linkedin.com", name: "LinkedIn", domain: "linkedin.com" },
  { match: "naukri.com", name: "Naukri.com", domain: "naukri.com" },
  { match: "indeed.com", name: "Indeed", domain: "indeed.com" },
  { match: "glassdoor", name: "Glassdoor", domain: "glassdoor.com" },
  { match: "wellfound.com", name: "Wellfound", domain: "wellfound.com" },
  { match: "cutshort.io", name: "Cutshort", domain: "cutshort.io" },
  { match: "foundit.in", name: "Foundit", domain: "foundit.in" },
  { match: "hirist.tech", name: "Hirist", domain: "hirist.tech" },
  { match: "instahyre.com", name: "Instahyre", domain: "instahyre.com" },
  { match: "unstop.com", name: "Unstop", domain: "unstop.com" },
  { match: "weworkremotely.com", name: "We Work Remotely", domain: "weworkremotely.com" },
  { match: "google.com", name: "Google Jobs", domain: "google.com" },
];

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function detectPlatform(url: string): PlatformInfo {
  let hostname = "";

  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    hostname = "";
  }

  const found = KNOWN_PLATFORMS.find((p) => hostname.includes(p.match));

  if (found) {
    return {
      name: found.name,
      domain: found.domain,
      logo: faviconUrl(found.domain),
    };
  }

  const fallbackDomain = hostname || "unknown";
  return {
    name: fallbackDomain,
    domain: fallbackDomain,
    logo: faviconUrl(fallbackDomain),
  };
}