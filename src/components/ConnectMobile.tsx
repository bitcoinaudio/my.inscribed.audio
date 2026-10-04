import React from "react";
import ConnectWallet from "./ConnectWallet";

// Mobile renders the same shared login: the signer already picks the NIP-46 path
// from the runtime it detects, so there is no separate mobile surface to keep in
// sync (the previous split is what let the two drift apart).
const ConnectMobile = ({ className = "" }: { className?: string }) => {
  return <ConnectWallet className={className} />;
};

export default ConnectMobile;
