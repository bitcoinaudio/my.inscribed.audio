// Unit check for lib/walletMedia.ts: collection membership and content
// enrichment. Run with:
//   node scripts/test-wallet-media.mjs
// Uses esbuild (already a dev dependency) to load the TS module, then stubs
// global fetch so the test makes no network calls.
import { build } from 'esbuild'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const out = join(mkdtempSync(join(tmpdir(), 'wm-')), 'walletMedia.mjs')
await build({
  entryPoints: ['src/lib/walletMedia.ts'],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'node',
  loader: { '.json': 'json' },
  logLevel: 'error',
})

// Fixture ids: the first two are real entries in the shipped curated collections.
const IOM_ID = 'b1ade815da823de16f0dc26417c5bfb9caefc9005f0e9585b1f0072eb7e43605i0'
const DUST_ID = '7ab25c17eafff0de350e6189cb9e3642239f2e6b580c0edf0b8640184e5a96e2i0'
const BEATBLOCK_ID = '808f2bcdf19691342041adfa507abba33003bfb2643496bb256897a2c8dc1808i0'
const PLAIN_ID = 'a'.repeat(64) + 'i0'
const BRC420_ID = 'b'.repeat(64) + 'i7'
const BITMAP_ID = 'c'.repeat(64) + 'i1'

let calls = []
globalThis.fetch = async (url) => {
  calls.push(String(url))
  if (String(url).endsWith('/content/' + BRC420_ID)) {
    return { ok: true, text: async () => '/content/' + 'd'.repeat(64) + 'i0' }
  }
  if (String(url).endsWith('/content/' + BITMAP_ID)) {
    return { ok: true, text: async () => '849999.bitmap' }
  }
  if (String(url).endsWith('/content/' + PLAIN_ID)) {
    return { ok: true, text: async () => '<html>not a pointer</html>' }
  }
  // Default: the radinals HEAD probe succeeds, so the host stays radinals.
  return { ok: true, text: async () => '' }
}

const { getCollectionInfo, enrichInscriptions, ITEMS_PER_PAGE } = await import(pathToFileURL(out).href)

let failures = 0
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`}`)
}

// ── collection membership (local, must not touch the network) ────────────────
calls = []
check('iom id -> ides-of-march', getCollectionInfo(IOM_ID).collection, 'ides-of-march')
check('iom carries attributes', Array.isArray(getCollectionInfo(IOM_ID).attributes), true)
check('dust id -> dust', getCollectionInfo(DUST_ID).collection, 'dust')
check('beatblock prefix flagged', getCollectionInfo(BEATBLOCK_ID).isBeatBlock, true)
check('plain id -> none', getCollectionInfo(PLAIN_ID).collection, null)
check('plain id -> basic', getCollectionInfo(PLAIN_ID).isEnhanced, false)
check('membership made no network calls', calls.length, 0)

// ── enrichment (one fetch per inscription, bounded) ──────────────────────────
calls = []
const items = await enrichInscriptions([
  { inscriptionId: PLAIN_ID, contentType: 'image/png' },
  { inscriptionId: BRC420_ID, contentType: 'text/plain' },
  { inscriptionId: BITMAP_ID, contentType: 'text/plain' },
  { inscriptionId: IOM_ID, contentType: 'audio/ogg' },
], 10)

check('all four items returned', items.length, 4)
check('plain stays plain', items[0].meta.isBRC420 || items[0].meta.isBitmap, false)
check('brc420 pointer detected', items[1].meta.isBRC420, true)
check('brc420 url rebased on resolved host', items[1].meta.brc420Url, 'https://radinals.bitcoinaudio.co/content/' + 'd'.repeat(64) + 'i0')
check('bitmap name parsed', items[2].meta.bitmap, '849999')
check('bitmap flagged', items[2].meta.isBitmap, true)
check('iom membership attached to wallet item', items[3].collection.isIOM, true)
// 1 host probe + 1 content fetch per item, i.e. no second fetch per inscription.
check('fetch count = probe + one per item', calls.length, 1 + 4)

// ── enrichment is bounded by the limit ───────────────────────────────────────
calls = []
const many = Array.from({ length: 40 }, (_, i) => ({ inscriptionId: 'e'.repeat(60) + String(i).padStart(4, '0') + 'i0', contentType: 'image/png' }))
const bounded = await enrichInscriptions(many, ITEMS_PER_PAGE)
check('limit respected', bounded.length, ITEMS_PER_PAGE)
// The host probe runs once per session (cached), so the second batch costs only
// one content fetch per item — and none of them are HEAD probes.
check('bounded fetch count', calls.length, ITEMS_PER_PAGE)
check('no repeated host probe', calls.some((u) => u === 'https://radinals.bitcoinaudio.co'), false)

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
