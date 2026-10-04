// utils/inscriptions.ts
import idesofmarch from '../lib/collections/idesofmarch.json';
import dust from '../lib/collections/dust.json';

export const ORD_SITE_1 = "https://radinals.bitcoinaudio.co";
export const ORD_SITE_2 = "https://ordinals.com";
const BEATBLOCK_PREFIX = "808f2bcdf19691342041adfa507abba33003bfb2643496bb256897a2c8dc1808i";

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

export async function getBRC420Data(id: string): Promise<{ isBRC420: boolean; brc420Url: string }> {
  const ordinalsSite = await getOrdinalsSite();
  try {
    const res = await fetch(`${ordinalsSite}/content/${id}`, {
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    return text.startsWith("/content/")
      ? { isBRC420: true, brc420Url: `${ordinalsSite}${text.trim()}` }
      : { isBRC420: false, brc420Url: '' };
  } catch {
    return { isBRC420: false, brc420Url: '' };
  }
}

export async function getBitmapData(id: string): Promise<{ isBitmap: boolean; bitmap: string }> {
  const ordinalsSite = await getOrdinalsSite();
  try {
    const res = await fetch(`${ordinalsSite}/content/${id}`, {
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    const regex = /^(?:0|[1-9][0-9]*).bitmap$/;
    return regex.test(text)
      ? { isBitmap: true, bitmap: text.split(".")[0] }
      : { isBitmap: false, bitmap: '' };
  } catch {
    return { isBitmap: false, bitmap: '' };
  }
}

export function isEnhancedInscription(id: string, iomSet: Set<string>, dustSet: Set<string>): boolean {
  return iomSet.has(id) || dustSet.has(id);
}

export function getInscriptionAttributes(id: string): any {
  try {
    const match = [...idesofmarch, ...dust].find(item => item.id === id);
    return match?.meta?.attributes || null;
  } catch {
    return null;
  }
}

export function isBeatBlockInscription(id: string): boolean {
  return id.startsWith(BEATBLOCK_PREFIX);
}

// NOTE: You must import `idesofmarch` and `dust` here if using in frontend.
// Alternatively, in a backend context, load from database or FS.
