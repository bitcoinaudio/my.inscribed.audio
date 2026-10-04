// End-to-end NOSTR auth probe: challenge -> sign (NIP-07 shape) -> verify -> session.
// Throwaway key, in-memory. Read-only; any session it creates is discarded.
const base = process.env.TARGET || 'https://my.inscribed.audio';
const { generateSecretKey, getPublicKey, finalizeEvent } = await import('../node_modules/nostr-tools/lib/esm/pure.js');
const { npubEncode } = await import('../node_modules/nostr-tools/lib/esm/nip19.js');

const post = async (path, payload, token) => {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(payload ?? {}),
  });
  const raw = await res.text();
  let body = raw;
  try { body = JSON.parse(raw); } catch {}
  return { status: res.status, body };
};

console.log('== target', base);
const sk = generateSecretKey();
const pubkey = getPublicKey(sk);
console.log('npub', npubEncode(pubkey));

const challenge = await post('/api/nostr-auth/challenge');
console.log('challenge', challenge.status, 'kind', challenge.body?.event?.kind,
  'tags', JSON.stringify(challenge.body?.event?.tags));

// NIP-07's signEvent receives the template and returns the signed event.
const signed = finalizeEvent(challenge.body.event, sk);
console.log('signed kind', signed.kind, 'sig len', signed.sig.length);

const verify = await post('/api/nostr-auth/verify', { signedEvent: signed });
console.log('verify', verify.status, JSON.stringify(verify.body).slice(0, 320));

if (verify.status === 200 && verify.body.sessionToken) {
  const token = verify.body.sessionToken;
  const sess = await fetch(base + '/api/wallet-auth/session', {
    headers: { Authorization: 'Bearer ' + token, Origin: base },
  });
  console.log('session', sess.status, (await sess.text()).slice(0, 220));
  const out = await post('/api/nostr-auth/logout', {}, token);
  console.log('logout', out.status, JSON.stringify(out.body));
}
