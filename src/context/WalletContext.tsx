// Wallet/identity context for my.inscribed.audio.
//
// The implementation now lives in the shared @bitcoinaudio-org/signer package —
// the same provider every sibling BitcoinAudio frontend uses — so login, provider
// detection, mobile deeplink resume and the NIP-07/NIP-46 surface behave (and
// look) identically here. Only the backend adapter is site-specific: nostr
// connect mints a session from the beatfeed-hosted nostr auth routes, while a
// Bitcoin wallet stays a payment instrument and never authenticates.
import React, { type ReactNode } from "react";
import {
  WalletProvider as SharedWalletProvider,
  useWallet,
} from "@bitcoinaudio-org/signer/react";
import { myInscribedAdapter } from "../lib/myInscribedAdapter";

const WALLET_CONFIG = {
  appName: "My Inscribed Audio",
  appUrl: typeof window !== "undefined" ? window.location.origin : "https://my.inscribed.audio",
  appHost: "my.inscribed.audio",
  // Preserves the existing myinscribed.* localStorage keys (theme, connected
  // wallet) so nobody is logged out or loses state across this upgrade.
  storagePrefix: "myinscribed",
  // Nostr login mints a server session, so the identity is only rehydrated when
  // that session still validates (matched from the pre-migration behaviour).
  restoreNostrRequiresAuth: true,
};

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <SharedWalletProvider config={WALLET_CONFIG} adapter={myInscribedAdapter}>
      {children}
    </SharedWalletProvider>
  );
}

export { useWallet };
