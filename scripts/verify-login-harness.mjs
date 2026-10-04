// Local verification harness for the my.inscribed.audio login.
//
// Serves the production build from dist/ AND proxies /api/* to the live origin,
// because the app talks to its API same-origin (Caddy routes /api/* to
// beatfeed_api) — a plain static server would 404 every auth call.
//
// It also exposes a throwaway NIP-07 signer at /__sign + /__pubkey so a browser
// run can exercise the real login end to end against the live server without a
// wallet extension. The key exists only in this process.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure'

const ROOT = new URL('../dist/', import.meta.url).pathname
const TARGET = process.env.TARGET || 'https://my.inscribed.audio'
const PORT = Number(process.env.PORT || 5199)

const sk = generateSecretKey()
const pubkey = getPublicKey(sk)

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json',
}

const readBody = (req) => new Promise((resolve) => {
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
})

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)

  // These two routes may be exercised from a page on the production origin (a
  // browser run of the live site), so they answer preflights too.
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  }
  if (req.method === 'OPTIONS' && url.pathname.startsWith('/__')) {
    res.writeHead(204, cors)
    return res.end()
  }

  if (url.pathname === '/__pubkey') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors })
    return res.end(JSON.stringify({ pubkey }))
  }

  if (url.pathname === '/__sign') {
    const template = JSON.parse(await readBody(req))
    const signed = finalizeEvent(template, sk)
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors })
    return res.end(JSON.stringify(signed))
  }

  if (url.pathname.startsWith('/api/')) {
    const upstream = await fetch(TARGET + url.pathname + url.search, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Origin: TARGET,
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req),
    })
    const text = await upstream.text()
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    return res.end(text)
  }

  const rel = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '')
  const file = rel === '/' ? '/index.html' : rel
  try {
    const body = await readFile(join(ROOT, file))
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
    return res.end(body)
  } catch {
    const body = await readFile(join(ROOT, 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html' })
    return res.end(body)
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`harness on http://127.0.0.1:${PORT} -> dist/ (api proxied to ${TARGET})`)
  console.log(`throwaway signer npub-key ${pubkey}`)
})
