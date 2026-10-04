import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer } from "../utils/motion";
import { useWallet } from "../context/WalletContext";
import { PaymentWalletButton } from "@bitcoinaudio-org/signer/react";
import { useOrdinalsHost } from "../context/OrdinalsHostContext";
import { ORD_SITE_2 } from "../utils/inscriptions";
import beatblockImage from "/images/beatblocks.png";
import ordImage from "/images/ordinals.svg";
import iomImage from "/images/idesofmarch.png";
import woman from "/images/woman-sticker.webp";
import MimeTypeFilter from "../components/MimeTypeFilter";
import GLTFViewer from "../components/GLTFViewer";
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";

// Constants
const ITEMS_PER_PAGE = 10;

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
  const isBeatBlock = item.isBeatBlock;
  const isBitmap = item.isBitmap;
  const contentUrl = item.isBRC420 ? item.brc420Url : `${ordHost}/content/${item.id}`;
  const previewUrl = `${ordHost}/preview/${item.id}`;

  const handleImgError = (e) => {
    const fallback = `${ORD_SITE_2}/content/${item.id}`;
    if (e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
  };

  const renderContent = () => {
    switch (contentCategory) {
      case "text":
        return item.contentType.startsWith("text/html") ? (
          <LazyIframe src={contentUrl} />
        ) : isBitmap ? (
          <div>
            <LazyIframe src={`https://feed.bitmapstr.io/block/height/${item.bitmap}`} />
             <p className="py-4 text-lg font-urbanist font-medium text-primary/80">
              {item.bitmap + '.bitmap'}
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
        return  <GLTFViewer src={contentUrl} />
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

  return (
    <div className="card mt-4 max-w-2xl gap-4 rounded-box border border-base-300 bg-base-200 transition duration-300 hover:-translate-y-1 hover:border-primary/50">
      <div className="card-body">
        {renderContent()}
        
        <p className="text-md font-urbanist font-medium opacity-60">
          {item.isEnhanced ? "Enhanced" : "Basic"} {item.isBRC420 ? "BRC420" : "Ordinal"}
          <hr />
          {item.attributes && (
            <div>
              <h3 className="font-urbanist text-xl font-bold">Attributes:</h3>
              <ul className="list-disc list-inside">
                {Object.entries(item.attributes[0] || {}).map(([key, value]) => (
                  <li key={key} className="text-md font-urbanist font-medium opacity-60">
                    {key}: {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </p>

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
            {item.isIOM && (
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
            {item.isBeatBlock && (
              <li>
                <a
                  className="tooltip"
                  data-tip="BeatBlock.io"
                  href={`https://www.beatblocks.io/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="120" height="35" viewBox="0 0 969 283" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto"><path d="M137.315 32.5269V0H104.809V32.5269H83.281V0H50.7754V32.5269H0V250.473H50.7366V283H83.2422V250.473H104.77V283H137.276V250.473H188.013V32.5269H137.276H137.315ZM42.2805 208.204V158.792H145.848V208.204H42.2805ZM42.2805 124.557V74.8353H145.848V124.557H42.2805Z" fill="#FF6804"></path><path d="M281.185 150.874H239.292V192.794H281.185V206.767H225.328V81.0069H281.185V94.9802H295.149V136.9H281.185V94.9802H239.292V136.9H281.185V150.874H295.149V192.794H281.185V150.874Z" fill="white"></path><path d="M326.569 192.794H312.604V136.9H326.569V150.874H368.461V136.9H326.569V122.927H368.461V136.9H382.425V164.847H326.569V192.794H368.461V206.767H326.569V192.794ZM368.5 178.821H382.464V192.794H368.5V178.821Z" fill="white"></path><path d="M413.884 192.794H399.92V164.847H413.884V192.794H455.776V164.847H413.884V150.874H455.776V136.9H413.884V122.927H455.776V136.9H469.741V206.767H413.884V192.794Z" fill="white"></path><path d="M487.196 94.9802H501.16V122.927H515.124V136.9H501.16V192.794H515.124V206.767H501.16V192.794H487.196V94.9802Z" fill="white"></path><path d="M588.436 150.874H546.544V192.794H588.436V206.767H532.58V81.0069H588.436V94.9802H602.401V136.9H588.436V94.9802H546.544V136.9H588.436V150.874H602.401V192.794H588.436V150.874Z" fill="white"></path><path d="M619.856 81.0069H633.82V206.767H619.856V81.0069Z" fill="white"></path><path d="M651.275 136.9H665.24V192.794H651.275V136.9ZM665.24 122.927H707.132V136.9H665.24V122.927ZM665.24 192.794H707.132V206.767H665.24V192.794ZM707.132 136.9H721.096V192.794H707.132V136.9Z" fill="white"></path><path d="M738.552 136.9H752.516V192.794H738.552V136.9ZM752.516 122.927H794.409V136.9H752.516V122.927ZM752.516 192.794H794.409V206.767H752.516V192.794ZM794.409 136.9H808.373V150.874H794.409V136.9ZM794.409 178.821H808.373V192.794H794.409V178.821Z" fill="white"></path><path d="M853.795 164.847H839.831V206.767H825.867V81.0069H839.831V150.874H853.795V164.847H867.759V178.821H881.724V192.794H895.688V206.767H881.724V192.794H867.759V178.821H853.795V164.847ZM853.795 136.9H867.759V150.874H853.795V136.9ZM867.759 122.927H881.724V136.9H867.759V122.927Z" fill="white"></path><path d="M913.104 136.9H927.069V150.874H913.104V136.9ZM913.104 178.821H927.069V192.794H913.104V178.821ZM927.107 122.927H955.036V136.9H927.107V122.927ZM927.107 150.874H941.072V164.847H927.107V150.874ZM927.107 192.794H955.036V206.767H927.107V192.794ZM941.072 164.847H955.036V178.821H941.072V164.847ZM955.036 136.9H969V150.874H955.036V136.9ZM955.036 178.821H969V192.794H955.036V178.821Z" fill="white"></path></svg>
                </a>
              </li>

              
            )}
            {item.attributes && (
              <div>
                <ul className="">
                  {Object.entries(item.attributes[0] || {}).map(([key, value]) => (
                    <div key={key} className="">
                      {value === "Woman" && (
                        <button
                          className="tooltip"
                          onClick={openMusicPlayer}
                        >
                          <img id="image" className="w-12 h-10" src={woman} alt="Woman" />
                        </button>
                      )}
                    </div>
                  ))}
                </ul>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
});

// MyMedia Component
const MyMedia = () => {
  const { walletItems, isWalletConnected, address } = useWallet();
  const [selectedMimeTypes, setSelectedMimeTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => (
    selectedMimeTypes.length > 0
      ? walletItems.filter((item) => {
          const matchesMime = selectedMimeTypes.includes(item.contentType);
          const matchesBitmap = selectedMimeTypes.includes(BITMAP_FILTER_KEY) && item.isBitmap;
          return matchesMime || matchesBitmap;
        })
      : walletItems
  ), [selectedMimeTypes, walletItems]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

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
          <div className="mb-6 w-full max-w-lg rounded-box border border-base-300 bg-base-200 p-4 text-center">
            <p className="text-sm text-base-content/75">
              Load the ordinals held by a Bitcoin wallet. This only reads your inscriptions —
              it is not a login, and it never changes your Nostr identity.
            </p>
            <div className="mt-3 flex justify-center">
              <PaymentWalletButton label="Connect wallet" />
            </div>
          </div>
        ) : null}
          <div className="mb-4 rounded-box border border-base-300 bg-base-200 px-4 py-3 text-center">
            <span className="text-sm font-bold">Total Items: {filteredItems.length}</span>
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

          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {paginatedItems.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MyMedia;
