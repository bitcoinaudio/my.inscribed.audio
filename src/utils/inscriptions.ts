// utils/inscriptions.ts
//
// The ordinals-host resolver, and nothing else. Per-inscription enrichment and
// collection membership moved to lib/walletMedia.ts; My Media's host still comes
// from useOrdinalsHost(), which resolves through here.
export const ORD_SITE_1 = "https://radinals.bitcoinaudio.co";
export const ORD_SITE_2 = "https://ordinals.com";

let ordinalsSitePromise: Promise<string> | null = null;

export function getOrdinalsSite(): Promise<string> {
  if (ordinalsSitePromise) return ordinalsSitePromise;
  ordinalsSitePromise = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(ORD_SITE_1, { method: "HEAD", signal: ctrl.signal });
      return res.ok ? ORD_SITE_1 : ORD_SITE_2;
    } catch (err) {
      console.warn("Falling back to secondary ordinals site:", err);
      return ORD_SITE_2;
    } finally {
      clearTimeout(timer);
    }
  })();
  return ordinalsSitePromise;
}

// getOrdinalsSite() lives here because OrdinalsHostContext (and the host used by
// every content URL in the app) resolves through it. Note it caches the first
// answer for the session: a site that is up now stays chosen even if it blips.
