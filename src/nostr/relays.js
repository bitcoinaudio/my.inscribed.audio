// Relay list for this frontend. Single source of truth is the shared signer
// package, so every BitcoinAudio site reads and publishes to the same relays;
// only the site identity (name/url, set by the shared WalletProvider) differs.
import { NOSTR_RELAYS } from "@bitcoinaudio-org/signer/nostr";

export { NOSTR_RELAYS };
