// Client half of the Beatfeed-hosted NOSTR account auth (NIP-42 style challenge).
//
// The backend routes (/api/nostr-auth/challenge|verify|logout) are mounted by the
// beatfeed API that already serves this site's /api/* — my.inscribed.audio has no
// auth server of its own, and must not grow one. Same origin, same session store,
// so the nostr session issued to this site is validated exactly like beatfeed's.
const API_BASE = ""; // same-origin: Caddy routes /api/* to beatfeed_api

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Nostr authentication failed (${response.status})`);
  return body as T;
}

export type SignedEvent = { id: string; pubkey: string; sig: string; kind: number; tags: string[][]; content: string; created_at: number };
export type NostrEventTemplate = { kind: number; tags: string[][]; content: string; created_at?: number };

export async function nostrAuthChallenge(): Promise<{ challengeId: string; event: NostrEventTemplate }> {
  return request<{ challengeId: string; event: NostrEventTemplate }>("/api/nostr-auth/challenge", { method: "POST" });
}

export async function nostrAuthVerify(signedEvent: SignedEvent): Promise<{
  sessionToken: string;
  session: { provider: string; pubkey: string; npub: string; roles: string[]; issuedAt?: string; expiresAt?: string };
}> {
  return request("/api/nostr-auth/verify", { method: "POST", body: JSON.stringify({ signedEvent }) });
}

export async function nostrAuthLogout(sessionToken: string): Promise<{ ok: true }> {
  return request("/api/nostr-auth/logout", {
    method: "POST",
    headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
  });
}
