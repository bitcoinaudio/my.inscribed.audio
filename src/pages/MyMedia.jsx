import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer } from "../utils/motion";
import { useWallet } from "../context/WalletContext";
import { WalletConnectMenu } from "../components/ConnectWallet";
import { useOrdinalsHost } from "../context/OrdinalsHostContext";
import { ORD_SITE_2 } from "../utils/inscriptions";
import { ITEMS_PER_PAGE, enrichInscriptions } from "../lib/walletMedia";
import beatblockImage from "/images/beatblocks.png";
import ordImage from "/images/ordinals.svg";
import iomImage from "/images/idesofmarch.png";
import woman from "/images/woman-sticker.webp";
import MimeTypeFilter from "../components/MimeTypeFilter";
import GLTFViewer from "../components/GLTFViewer";

// Constants
const MIME_TYPES = {
  text: [
    "application/json",
    "text/css",
    "text/javascript",
    "text/plain",
    "text/plain;charset=utf-8",
    "text/html",
    "text/html;charset=utf-8",
  ],
  audio: ["audio/ogg", "audio/mpeg"],
  video: ["video/mp4"],
  image: [
    "image/png",
    "image/gif",
    "image/jpeg",
    "image/svg+xml",
    "image/webp",
  ],
  model: ["model/gltf+json", "model/gltf-binary"],
};

const ALL_MIME_TYPES = Object.values(MIME_TYPES).flat();
const BITMAP_FILTER_KEY = "bitmaps";
const FILTER_ITEMS = [...ALL_MIME_TYPES, BITMAP_FILTER_KEY];

const getContentCategory = (contentType) => {
  if (MIME_TYPES.text.includes(contentType)) return "text";
  if (MIME_TYPES.audio.includes(contentType)) return "audio";
  if (MIME_TYPES.video.includes(contentType)) return "video";
  if (MIME_TYPES.image.includes(contentType)) return "image";
  if (MIME_TYPES.model.includes(contentType)) return "model";
  return "unknown";
};

// LazyIframe Component
const LazyIframe = ({ src, placeholderSrc, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" } // Preload 100px before entering viewport
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <iframe
          src={src}
          height="100%"
          width="100%"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <div className="skeleton size-48" /> // Fallback to skeleton; replace with img if you have placeholders
        // <img src={placeholderSrc || "/placeholder.jpg"} alt="Placeholder" className="size-48" />
      )}
    </div>
  );
};

// Cross-browser compatible window.open function
const openMusicPlayer = () => {
  const url = "https://up6it6g3dbstnw4j5rbyolaur3n27hv5ur2eojhmsd243jgzpxta.ar.io/o_yJ-NsYZTbbiexDhywUjtuvnr2kdEck7JD1zaTZfeY/";
  const windowName = "musicPlayer_" + Date.now(); // Unique name to avoid conflicts

  // Enhanced window features for better cross-browser compatibility
  const windowFeatures = [
    "width=800",
    "height=600",
    "resizable=yes",
    "scrollbars=yes",
    "location=no",
    "toolbar=no",
    "menubar=no",
    "status=no",
    "directories=no",
    "personalbar=no",
    "titlebar=no",
    "addressbar=no"
  ].join(",");

  try {
    const popup = window.open(url, windowName, windowFeatures);

    // Handle popup blocker
    if (!popup) {
      // Fallback: try without window features (some browsers are less restrictive)
      const fallbackPopup = window.open(url, windowName);
      if (!fallbackPopup) {
        // Final fallback: open in new tab
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        fallbackPopup.focus();
      }
    } else {
      // Focus the popup window
      popup.focus();

      // Optional: Add error handling for cross-origin restrictions
      try {
        popup.document.title = "Music Player";
      } catch (e) {
        // Cross-origin restriction - ignore
      }
    }
  } catch (error) {
    console.warn("Window.open failed, falling back to new tab:", error);
    // Ultimate fallback: new tab
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

// MediaCard Component
const MediaCard = React.memo(({ item }) => {
  const ordHost = useOrdinalsHost();
  const contentCategory = getContentCategory(item.contentType);
  const isBitmap = item.meta.isBitmap;
  const contentUrl = item.meta.isBRC420 ? item.meta.brc420Url : `${ordHost}/content/${item.id}`;

  const handleImgError = (e) => {
    const fallback = `${ORD_SITE_2}/content/${item.id}`;
    if (e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
  };

  const renderContent = () => {
    switch (contentCategory) {
      case "text":
        return item.contentType?.startsWith("text/html") ? (
          <LazyIframe src={contentUrl} />
        ) : isBitmap ? (
          <div>
            <LazyIframe src={`https://feed.bitmapstr.io/block/height/${item.meta.bitmap}`} />
            <p className="py-4 text-lg font-urbanist font-medium text-primary/80">
              {item.meta.bitmap + ".bitmap"}
            </p>
          </div>
        ) : (
          <p className="text-md font-urbanist font-medium opacity-60">
            {item.contentType}
          </p>
        );
      case "image":
        return (
          <div className="card-body shadow-inner">
            <img className="size-48" src={contentUrl} alt="Inscription" onError={handleImgError} />
          </div>
        );
      case "model":
        return <GLTFViewer src={contentUrl} />;
      case "video":
      case "audio":
        return (
          <video width="320" height="240" controls>
            <source src={contentUrl} />
          </video>
        );
      default:
        return <LazyIframe src={contentUrl} />;
    }
  };

  const attributes = item.collection.attributes;
  // The curated editions each carry one attribute row; only the "Woman" edition
  // had a music-player affordance, and the old card offered it twice (details
  // list and action bar). Now it appears once.
  const isWomanEdition = Array.isArray(attributes)
    && attributes.some((entry) => Object.values(entry || {}).includes("Woman"));

  return (
    <div className="card mt-4 max-w-2xl gap-4 rounded-box border border-base-300 bg-base-200 transition duration-300 hover:-translate-y-1 hover:border-primary/50">
      <div className="card-body">
        {renderContent()}

        <div className="text-md font-urbanist font-medium opacity-60">
          <p>
            {item.collection.isEnhanced ? "Enhanced" : "Basic"} {item.meta.isBRC420 ? "BRC420" : "Ordinal"}
            {item.collection.collectionName ? ` · ${item.collection.collectionName}` : ""}
          </p>
          <p className="mt-1 truncate text-xs text-base-content/50" title={item.id}>{item.id}</p>
          <hr />
          {Array.isArray(attributes) && attributes.length > 0 && (
            <div>
              <h3 className="font-urbanist text-xl font-bold">Attributes:</h3>
              <ul className="list-inside list-disc">
                {attributes.map((row, index) => (
                  <li key={index}>
                    {Object.entries(row || {}).map(([key, value]) => (
                      <span key={key}>{key}: {value}</span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card-actions justify-center">
          <ul className="menu menu-horizontal mt-1 rounded-box bg-base-100">
            <li>
              <a
                className="tooltip"
                data-tip="Details"
                href={`${ordHost}/inscription/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                className="tooltip"
                data-tip="Ordinal"
                href={`${ordHost}/content/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img className="size-5" src={ordImage} alt="Ordinal" />
              </a>
            </li>
            {item.collection.isIOM && (
              <li>
                <a
                  className="tooltip"
                  data-tip="IOM"
                  href="https://2afgcisoscfoxn2hagwwbpjwypob5i3qtsfzl2pyzufumbty3bua.ar.io/0AphIk6Qiuu3RwGtYL02w9weo3Cci5Xp-M0LRgZ42Gg/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img className="size-10" src={iomImage} alt="IOM" />
                </a>
              </li>
            )}
            {item.collection.isBeatBlock && (
              <li>
                <a
                  className="tooltip"
                  data-tip="BeatBlock.io"
                  href={`https://www.beatblocks.io/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img className="h-6 w-auto" src={beatblockImage} alt="BeatBlock.io" />
                </a>
              </li>
            )}
            {isWomanEdition && (
              <li>
                <button className="tooltip" data-tip="Play" onClick={openMusicPlayer}>
                  <img className="h-10 w-12" src={woman} alt="Woman" />
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
});

// MyMedia Component
const MyMedia = () => {
  const {
    isWalletConnected,
    address,
    provider,
    walletItems,
    fetchInscriptions,
    setWalletItems,
    disconnectWallet,
  } = useWallet();
  const [enrichedItems, setEnrichedItems] = useState([]);
  const [selectedMimeTypes, setSelectedMimeTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [loadError, setLoadError] = useState("");

  // A connected wallet does not by itself mean the list is loaded: on a fresh
  // page load the provider restores the connection from storage but holds no
  // inscriptions. Fetch on connect and on arriving here with a stale-empty list.
  useEffect(() => {
    if (!isWalletConnected) return;
    if (walletItems.length > 0) return;

    let active = true;
    setIsLoadingItems(true);
    setLoadError("");
    // fetchInscriptions() returns the list; it does not touch provider state.
    // Storing it is this caller's job — skipping that was why a page load (as
    // opposed to an in-session connect) reported an empty wallet.
    fetchInscriptions(100)
      .then((items) => {
        if (active) setWalletItems(items);
      })
      .catch((error) => {
        if (active) setLoadError(error?.message || "Could not read inscriptions from the wallet");
      })
      .finally(() => {
        if (active) setIsLoadingItems(false);
      });
    return () => {
      active = false;
    };
  }, [isWalletConnected, walletItems.length, fetchInscriptions]);

  // Enrich only the page being shown, and say plainly what the wallet holds.
  const pageItems = useMemo(
    () => walletItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [walletItems, currentPage],
  );

  useEffect(() => {
    if (pageItems.length === 0) {
      setEnrichedItems([]);
      return undefined;
    }
    let active = true;
    enrichInscriptions(pageItems, ITEMS_PER_PAGE).then((items) => {
      if (active) setEnrichedItems(items);
    });
    return () => {
      active = false;
    };
  }, [pageItems]);

  const filteredItems = useMemo(
    () =>
      selectedMimeTypes.length > 0
        ? enrichedItems.filter((item) => {
            const matchesMime = selectedMimeTypes.includes(item.contentType);
            const matchesBitmap = selectedMimeTypes.includes(BITMAP_FILTER_KEY) && item.meta.isBitmap;
            return matchesMime || matchesBitmap;
          })
        : enrichedItems,
    [selectedMimeTypes, enrichedItems],
  );

  const totalPages = Math.max(1, Math.ceil(walletItems.length / ITEMS_PER_PAGE));
  const isFiltered = selectedMimeTypes.length > 0;
  const isEmpty = isWalletConnected && !isLoadingItems && walletItems.length === 0;

  // The shared provider deliberately does not rehydrate a wallet connection once
  // a Nostr identity exists (a wallet must never look like an account session).
  // So a signed-in visitor arrives here with the wallet still authorised in the
  // browser but not connected to this page. Say that plainly instead of showing a
  // bare "connect" prompt that reads like the previous connect was lost.
  const leftoverWallet = useMemo(() => {
    if (isWalletConnected) return null;
    try {
      const raw = localStorage.getItem("myinscribed.connectedWallet");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.provider === "unisat" || parsed?.provider === "xverse" ? parsed : null;
    } catch {
      return null;
    }
  }, [isWalletConnected]);

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.min(Math.max(newPage, 1), totalPages));
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      id="mymedia"
      className="flex flex-col items-center justify-center"
    >
      <motion.div variants={fadeIn("up", "tween", 0.2, 1)} className="w-full">
        <MimeTypeFilter
          mimeTypes={FILTER_ITEMS}
          selectedMimeTypes={selectedMimeTypes}
          onChange={setSelectedMimeTypes}
        />

        <div className="mt-4 flex flex-col items-center">
          {!isWalletConnected ? (
            <div className="mb-6 flex w-full max-w-lg flex-col items-center gap-3 rounded-box border border-base-300 bg-base-200 p-4 text-center">
              <p className="text-sm text-base-content/75">
                Explore the ordinals held in your Bitcoin wallet. Read-only — nothing is bought or
                sold here, and connecting does not change your Nostr identity.
              </p>
              {leftoverWallet ? (
                <p className="text-xs text-base-content/60">
                  {leftoverWallet.provider === "unisat" ? "UniSat" : "Xverse"} is still authorised in
                  your browser but is not connected to this page — reconnect it to list its ordinals.
                </p>
              ) : null}
              <WalletConnectMenu />
            </div>
          ) : (
            <div className="mb-4 w-full max-w-2xl rounded-box border border-base-300 bg-base-100 px-4 py-2 text-center text-xs text-base-content/70">
              <span className="font-bold uppercase tracking-wide">{provider}</span>{" "}
              <span className="font-mono">{address}</span>{" "}
              <button className="ml-2 underline" onClick={disconnectWallet}>
                disconnect
              </button>
            </div>
          )}

          {loadError ? <p className="mb-3 text-sm text-error">{loadError}</p> : null}

          {isLoadingItems ? (
            <div className="my-8 flex items-center gap-2 text-sm text-base-content/70">
              <span className="loading loading-spinner loading-sm" /> Reading inscriptions from the wallet…
            </div>
          ) : null}

          {isEmpty ? (
            <div className="my-8 max-w-lg rounded-box border border-base-300 bg-base-200 p-6 text-center text-sm text-base-content/70">
              No ordinals found in this wallet.
              <div className="mt-2 text-xs">
                Connect a different address, or check that this wallet holds inscriptions.
              </div>
            </div>
          ) : null}

          {!isLoadingItems && walletItems.length > 0 ? (
            <>
              <div className="mb-4 rounded-box border border-base-300 bg-base-200 px-4 py-3 text-center">
                <span className="text-sm font-bold">
                  {isFiltered
                    ? `${filteredItems.length} shown by the current filter, out of ${pageItems.length} on this page`
                    : `${walletItems.length} inscription${walletItems.length === 1 ? "" : "s"} in this wallet`}
                </span>
                <div className="mt-2 text-sm text-base-content/70">
                  Page {currentPage} of {totalPages}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  className="btn btn-ghost font-urbanist text-lg font-semibold"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <input
                  type="number"
                  className="input input-bordered w-20 text-center"
                  value={currentPage}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  min="1"
                  max={totalPages}
                />
                <button
                  className="btn btn-ghost font-urbanist text-lg font-semibold"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {enrichedItems.length === 0 && pageItems.length > 0 ? (
                  <div className="my-6 flex items-center gap-2 text-sm text-base-content/70">
                    <span className="loading loading-spinner loading-sm" /> Reading inscription metadata…
                  </div>
                ) : null}
                {filteredItems.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MyMedia;
