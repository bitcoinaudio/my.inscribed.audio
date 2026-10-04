import React from "react";
import { WalletLogin, useWallet } from "@bitcoinaudio-org/signer/react";

/**
 * The site's login control: the shared <WalletLogin> from
 * @bitcoinaudio-org/signer/react, so this frontend renders the same Nostr login
 * surface (NIP-07 extension on desktop, NIP-46 signer app on mobile) as every
 * other BitcoinAudio site. Appearance is themed by this site's daisyUI theme.
 *
 * Bitcoin wallets are intentionally absent here: connecting a wallet is a payment
 * action, not a login.
 */
const ConnectWallet = ({ className = "" }: { className?: string }) => {
  const { isNostrConnected, nostrNpub, nostrProfile } = useWallet();

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <WalletLogin />
      {isNostrConnected && !nostrProfile?.name && nostrNpub ? (
        <span className="text-[10px] text-base-content/60">signed in</span>
      ) : null}
    </div>
  );
};

export default ConnectWallet;
