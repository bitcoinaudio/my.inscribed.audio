import React, { useState } from "react";
import { PaymentWalletButton, WalletLogin, useWallet } from "@bitcoinaudio-org/signer/react";

/**
 * The site's login control: the shared <WalletLogin> from
 * @bitcoinaudio-org/signer/react, so this frontend renders the same Nostr login
 * surface (NIP-07 extension on desktop, NIP-46 signer app on mobile) as every
 * other BitcoinAudio site. Appearance is themed by this site's daisyUI theme.
 *
 * Bitcoin wallets sit behind a separate "Wallets" menu and stay payment/read
 * instruments: connecting one lists the ordinals it holds (My Media) and never
 * authenticates, mints a session, or displaces the Nostr identity.
 */
const ConnectWallet = ({ className = "" }: { className?: string }) => {
  const {
    isNostrConnected,
    nostrProfile,
    nostrNpub,
    isWalletConnected,
    provider,
    address,
    disconnectWallet,
  } = useWallet();
  const [walletsOpen, setWalletsOpen] = useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  const shortNpub = nostrNpub ? `${nostrNpub.slice(0, 8)}…${nostrNpub.slice(-6)}` : "";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isWalletConnected ? (
        <div className="flex items-center gap-2 rounded-full border border-base-300/80 bg-base-100/75 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-base-content/60">
            {provider}
          </span>
          <span className="font-mono text-xs text-base-content" title={address}>
            {shortAddress}
          </span>
          <button
            type="button"
            onClick={disconnectWallet}
            className="text-xs text-base-content/50 hover:text-base-content"
            title="Disconnect wallet"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setWalletsOpen((value) => !value)}
            aria-expanded={walletsOpen}
          >
            Wallets
          </button>
          {walletsOpen ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg">
              <p className="mb-2 text-[11px] leading-snug text-base-content/60">
                Reads the ordinals a wallet holds. Not a login — your Nostr identity is unchanged.
              </p>
              <PaymentWalletButton label="Connect" onReady={() => setWalletsOpen(false)} />
            </div>
          ) : null}
        </div>
      )}

      <WalletLogin />

      {isNostrConnected && !nostrProfile?.name && shortNpub ? (
        <span className="text-[10px] text-base-content/60">signed in</span>
      ) : null}
    </div>
  );
};

export default ConnectWallet;
