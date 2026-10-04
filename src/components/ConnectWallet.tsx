import React, { useCallback, useEffect, useRef, useState } from "react";
import { WalletLogin, useWallet } from "@bitcoinaudio-org/signer/react";
import { getXverseProvider } from "@bitcoinaudio-org/signer/wallet";

/**
 * Wallet connect for my.inscribed.audio.
 *
 * Two differences from the shared <PaymentWalletButton>, both because of what this
 * site is: it takes no payments, and reading a wallet is the point of the page.
 *
 * 1. Copy. The shared button is an action-scoped payment chooser ("Pay with …").
 *    Nothing here is for sale, so the rows say Connect, and the panel says what
 *    connecting actually does.
 * 2. Detection. The shared provider decides availability once, during a ~5s window
 *    at mount. A wallet that injects later is never noticed, the row stays
 *    disabled — and a disabled button answers a click with nothing at all, which
 *    is indistinguishable from a broken page. This menu re-detects on open, on
 *    window focus, and on a short interval while it is open.
 *
 * The connection itself is still the shared provider's own connectWallet() — the
 * same call the shared button makes — so UniSat/Xverse handling, mobile deeplinks
 * and persistence are unchanged; only the menu chrome is local.
 */
type WalletName = "unisat" | "xverse";

const WALLET_LABEL: Record<WalletName, string> = { unisat: "UniSat", xverse: "Xverse" };

const detectProviders = () => ({
  unisat: typeof window !== "undefined" && Boolean(window.unisat),
  xverse: typeof window !== "undefined" && Boolean(getXverseProvider()),
});

export function WalletConnectMenu({ className = "" }: { className?: string }) {
  const {
    runtime,
    isWalletConnected,
    provider,
    address,
    mobileResumeWallet,
    connectWallet,
    disconnectWallet,
    consumeMobileResumeWallet,
  } = useWallet();

  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState(detectProviders);
  const [busy, setBusy] = useState<WalletName | null>(null);
  const [notice, setNotice] = useState("");
  const [deeplink, setDeeplink] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    setProviders(detectProviders());
    const timer = window.setInterval(() => setProviders(detectProviders()), 300);
    const onFocus = () => setProviders(detectProviders());
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const choose = useCallback(
    async (wallet: WalletName, options?: { skipDeeplink?: boolean }) => {
      setBusy(wallet);
      setNotice("");
      setDeeplink("");
      try {
        await connectWallet(wallet, options);
        setOpen(false);
      } catch (error) {
        const failure = error as { code?: string; deeplink?: string; message?: string };
        if (failure?.code === "DEEPLINK_LAUNCHED" && failure.deeplink) {
          // Mobile browser: the provider only exists inside the wallet's own browser.
          setDeeplink(failure.deeplink);
        } else if (/not detected|not found/i.test(failure?.message || "")) {
          setNotice(
            `${WALLET_LABEL[wallet]} was not found in this browser. Install its extension, or open my.inscribed.audio inside the ${WALLET_LABEL[wallet]} app's own browser.`,
          );
        } else {
          setNotice(failure?.message || `${WALLET_LABEL[wallet]} connection failed`);
        }
      } finally {
        setBusy(null);
      }
    },
    [connectWallet],
  );

  // Came back from a wallet app: reconnect directly instead of bouncing again.
  useEffect(() => {
    if (!mobileResumeWallet || busy) return;
    choose(mobileResumeWallet as WalletName, { skipDeeplink: true })
      .finally(() => consumeMobileResumeWallet());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileResumeWallet]);

  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  if (isWalletConnected) {
    return (
      <div className={`flex items-center gap-2 rounded-full border border-base-300/80 bg-base-100/75 px-3 py-1.5 ${className}`}>
        <span className="text-[10px] font-bold uppercase tracking-wide text-base-content/60">
          {provider ? WALLET_LABEL[provider as WalletName] || provider : "wallet"}
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
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {busy ? "Connecting…" : "Connect wallet"}
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-3 text-left shadow-lg">
          <p className="text-[11px] leading-snug text-base-content/70">
            Explore the ordinals held in your Bitcoin wallet. Read-only, and not a login — your
            Nostr identity stays as it is.
          </p>

          <div className="mt-2 grid gap-1">
            {(["unisat", "xverse"] as WalletName[]).map((wallet) => (
              <button
                key={wallet}
                type="button"
                disabled={Boolean(busy)}
                onClick={() => choose(wallet)}
                className="btn btn-sm btn-ghost justify-start"
              >
                {busy === wallet ? "Connecting…" : `Connect ${WALLET_LABEL[wallet]}`}
                {!providers[wallet] && !runtime?.isMobile ? (
                  <span className="ml-auto text-[10px] font-normal opacity-50">not detected</span>
                ) : null}
              </button>
            ))}
          </div>

          {runtime?.isMobile && !runtime?.inWalletBrowser ? (
            <p className="mt-2 text-[10px] leading-snug text-base-content/50">
              On a phone the wallet's extension is not present in this browser, so connecting opens
              the wallet app and comes back here.
            </p>
          ) : null}

          {deeplink ? (
            <a className="btn btn-outline btn-xs mt-2 w-full" href={deeplink}>
              Open wallet app again
            </a>
          ) : null}

          {notice ? <p className="mt-2 text-[11px] leading-snug text-warning">{notice}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Navbar control: the Nostr login (the account) beside the wallet menu (the
 * ordinals). They are independent — signing in does not connect a wallet, and
 * connecting a wallet does not sign anyone in.
 */
const ConnectWallet = ({ className = "" }: { className?: string }) => {
  const { isNostrConnected, nostrProfile, nostrNpub } = useWallet();
  const shortNpub = nostrNpub ? `${nostrNpub.slice(0, 8)}…${nostrNpub.slice(-6)}` : "";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <WalletConnectMenu />
      <WalletLogin />
      {isNostrConnected && !nostrProfile?.name && shortNpub ? (
        <span className="text-[10px] text-base-content/60">signed in</span>
      ) : null}
    </div>
  );
};

export default ConnectWallet;
