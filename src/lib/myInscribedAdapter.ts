// my.inscribed.audio backend adapter for the shared
// @bitcoinaudio-org/signer WalletProvider.
//
// Nostr is the account identity, exactly as on the sibling sites. On connect the
// backend hands out a NIP-42-style challenge (kind 22242) which the user's NIP-07
// extension / NIP-46 signer signs; the signature is exchanged for a session token.
// The routes are hosted by the beatfeed API that already serves this site's /api/*,
// so the session is validated against the same store as beatfeed's own sessions.
//
// Bitcoin wallets (UniSat/Xverse) are payment instruments and are deliberately NOT
// an authentication method here: `onWalletConnected` is absent, so connecting a
// wallet can never manufacture a session or displace the nostr identity.
import type { SignedNostrEvent, NostrEventTemplate } from "@bitcoinaudio-org/signer/nostr";
import { nostrAuthChallenge, nostrAuthVerify, nostrAuthLogout } from "./nostrAuth";

const SESSION_KEY = "myinscribed.nostrSession";

export type StoredNostrSession = {
  token: string;
  pubkey: string;
  npub: string;
  roles: string[];
  expiresAt?: string;
};

export function readNostrSession(): StoredNostrSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredNostrSession;
    if (!value?.token) return null;
    if (value.expiresAt && Date.parse(value.expiresAt) <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return value;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeNostrSession(session: StoredNostrSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearNostrSession() {
  localStorage.removeItem(SESSION_KEY);
}

export const myInscribedAdapter = {
  async onNostrConnected({
    signEvent,
  }: {
    pubkey: string;
    profile: unknown;
    signEvent(template: NostrEventTemplate): Promise<SignedNostrEvent>;
  }) {
    const { event } = await nostrAuthChallenge();
    const signedEvent = await signEvent(event);
    const { sessionToken, session } = await nostrAuthVerify(signedEvent);
    writeNostrSession({
      token: sessionToken,
      pubkey: session?.pubkey || signedEvent.pubkey,
      npub: session?.npub || "",
      roles: session?.roles || [],
      expiresAt: session?.expiresAt,
    });
    return { roles: session?.roles || [], authenticated: true };
  },

  onDisconnect(kind: "wallet" | "nostr") {
    if (kind !== "nostr") return;
    const session = readNostrSession();
    clearNostrSession();
    if (session?.token) void nostrAuthLogout(session.token).catch(() => {});
  },

  isAuthenticated: () => Boolean(readNostrSession()),

  restore: () => ({ roles: readNostrSession()?.roles || [] }),

  // Re-check the stored session against the server on load, so a revoked or
  // expired server-side session cannot leave the chrome showing a signed-in
  // identity. Never throws: a failure is reported as unauthenticated.
  async validateSession() {
    const session = readNostrSession();
    if (!session?.token) return { authenticated: false, roles: [] as string[] };
    try {
      const res = await fetch("/api/wallet-auth/session", {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) throw new Error(`session ${res.status}`);
      const body = (await res.json()) as { authenticated?: boolean; roles?: string[] };
      const refreshed = { ...session, roles: body.roles || session.roles };
      writeNostrSession(refreshed);
      return { authenticated: Boolean(body.authenticated), roles: refreshed.roles };
    } catch {
      clearNostrSession();
      return { authenticated: false, roles: [] as string[] };
    }
  },
};
