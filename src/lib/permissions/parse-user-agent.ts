/** Minimal, dependency-free User-Agent parse for the Login & Security History display — good
 * enough to show "Chrome on Windows" instead of a raw UA string; not a full device-detection
 * library (no bot/version-precision needs here). */
export function parseUserAgent(userAgent: string | null | undefined): { browser: string; os: string } {
  if (!userAgent) return { browser: "Unknown", os: "Unknown" };
  const ua = userAgent;

  let browser = "Unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari";
  else if (/MSIE|Trident/.test(ua)) browser = "Internet Explorer";

  let os = "Unknown";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua) && /iPhone|iPad|iPod/.test(ua) === false) os = "macOS";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os };
}

export function formatUserAgent(userAgent: string | null | undefined): string {
  const { browser, os } = parseUserAgent(userAgent);
  if (browser === "Unknown" && os === "Unknown") return "Unknown device";
  return `${browser} on ${os}`;
}
