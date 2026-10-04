// Wallet → inscription enrichment for My Media.
//
// Two jobs, both only about *reading* what a wallet holds — this module never
// authenticates, mints or touches a session. The signer's own
// fetchWalletInscriptions() supplies the raw list (UniSat via getInscriptions,
// Xverse via ord_getInscriptions/getInscriptions); everything site-specific
// about *rendering* an ordinal lives here.
//
// The old bespoke component did this inline: two content fetches per inscription
// (one for BRC-420 pointers, one for bitmap names) against the ordinals host,
// with no bound at all. A wallet with 100+ inscriptions therefore fired 200+
// parallel requests and rendered a card for every one of them. Now every
// enrichment call has a deadline and the whole batch is bounded, and only the
// page being displayed is enriched.
import idesofmarch from "../lib/collections/idesofmarch.json";
import dust from "../lib/collections/dust.json";

export const ITEMS_PER_PAGE = 10;

// The ordinals host to read content from, resolved once. radinals is preferred
// but must not be trusted blindly: if it does not answer within the deadline the
// reader falls back to the public ordinals.com for the rest of the session.
const ORD_SITE_1 = "https://radinals.bitcoinaudio.co";
export const ORD_SITE_2 = "https://ordinals.com";
const ORD_PROBE_TIMEOUT_MS = 3000;
const ENRICH_TIMEOUT_MS = 8000;

let ordinalsSitePromise: Promise<string> | null = null;

export function getOrdinalsSite(): Promise<string> {
  if (ordinalsSitePromise) return ordinalsSitePromise;
  ordinalsSitePromise = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ORD_PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(ORD_SITE_1, { method: "HEAD", signal: ctrl.signal });
      return res.ok ? ORD_SITE_1 : ORD_SITE_2;
    } catch {
      return ORD_SITE_2;
    } finally {
      clearTimeout(timer);
    }
  })();
  return ordinalsSitePromise;
}

// ── Collection membership (local, no network) ────────────────────────────────

const IOM_BY_ID = new Map<string, Record<string, unknown>>(
  (idesofmarch as Array<{ id: string; meta?: { name?: string; attributes?: unknown } }>).map((item) => [
    item.id,
    { name: item.meta?.name, attributes: item.meta?.attributes },
  ]),
);

const DUST_BY_ID = new Map<string, Record<string, unknown>>(
  (dust as Array<{ id: string; meta?: { name?: string; attributes?: unknown } }>).map((item) => [
    item.id,
    { name: item.meta?.name, attributes: item.meta?.attributes },
  ]),
);

const BEATBLOCK_PREFIX = "808f2bcdf19691342041adfa507abba33003bfb2643496bb256897a2c8dc1808i";

export type CollectionInfo = {
  // Which curated collection the inscription belongs to, if any. This is what
  // decides whether the "Woman" music-player affordance is offered, so the
  // per-collection names are kept rather than collapsed into one boolean.
  collection: "ides-of-march" | "dust" | null;
  collectionName: string | null;
  isIOM: boolean;
  isDust: boolean;
  isEnhanced: boolean;
  isBeatBlock: boolean;
  attributes: Array<Record<string, unknown>> | null;
};

export function getCollectionInfo(id: string): CollectionInfo {
  const iom = IOM_BY_ID.get(id);
  const dustItem = DUST_BY_ID.get(id);
  const meta = iom || dustItem;

  return {
    collection: iom ? "ides-of-march" : dustItem ? "dust" : null,
    collectionName: (meta?.name as string) || null,
    isIOM: Boolean(iom),
    isDust: Boolean(dustItem),
    isEnhanced: Boolean(iom || dustItem),
    isBeatBlock: id.startsWith(BEATBLOCK_PREFIX),
    attributes: (meta?.attributes as Array<Record<string, unknown>>) || null,
  };
}

// ── Per-inscription content enrichment (network, bounded) ────────────────────

async function fetchInscriptionText(id: string): Promise<string | null> {
  const ordinalsSite = await getOrdinalsSite();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ENRICH_TIMEOUT_MS);
  try {
    const res = await fetch(`${ordinalsSite}/content/${id}`, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const BITMAP_RE = /^(?:0|[1-9][0-9]*).bitmap$/;

export type InscriptionMeta = {
  isBRC420: boolean;
  brc420Url: string;
  isBitmap: boolean;
  bitmap: string;
};

// One content fetch decides both flags: a BRC-420 inscription's content is a
// pointer to another inscription, a bitmap's content is its `<height>.bitmap`
// name. Reading it once is why the page no longer issues two requests per item.
export async function enrichInscription(id: string): Promise<InscriptionMeta> {
  const text = (await fetchInscriptionText(id))?.trim() ?? "";
  if (!text) return { isBRC420: false, brc420Url: "", isBitmap: false, bitmap: "" };

  if (text.startsWith("/content/")) {
    const ordinalsSite = await getOrdinalsSite();
    return { isBRC420: true, brc420Url: `${ordinalsSite}${text}`, isBitmap: false, bitmap: "" };
  }
  if (BITMAP_RE.test(text)) {
    return { isBRC420: false, brc420Url: "", isBitmap: true, bitmap: text.split(".")[0] };
  }
  return { isBRC420: false, brc420Url: "", isBitmap: false, bitmap: "" };
}

export type WalletMediaItem = {
  id: string;
  contentType?: string;
  meta: InscriptionMeta;
  collection: CollectionInfo;
};

// Enrich a bounded slice of inscriptions, tolerating per-item failures (a
// single unreachable inscription must not blank the page).
export async function enrichInscriptions(
  raw: Array<{ inscriptionId?: string; id?: string; contentType?: string; mimeType?: string; content_type?: string }>,
  limit = ITEMS_PER_PAGE,
): Promise<WalletMediaItem[]> {
  const slice = raw.slice(0, limit);
  const enriched = await Promise.all(
    slice.map(async (item) => {
      const id = item.inscriptionId || item.id;
      if (!id) return null;
      let meta: InscriptionMeta = { isBRC420: false, brc420Url: "", isBitmap: false, bitmap: "" };
      try {
        meta = await enrichInscription(id);
      } catch {
        // Keep the item, just without enrichment.
      }
      return {
        id,
        contentType: item.contentType || item.mimeType || item.content_type,
        meta,
        collection: getCollectionInfo(id),
      } as WalletMediaItem;
    }),
  );
  return enriched.filter(Boolean) as WalletMediaItem[];
}
