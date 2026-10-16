import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Video, X, Sparkles } from "lucide-react";
import type { Listing } from "@/data/listings";

interface PropertyGalleryModalProps {
  listing: Listing | null;
  initialIndex?: number;
  onClose: () => void;
}

interface MediaItem {
  type: "image" | "video";
  url: string;
  label: string;
}

export function PropertyGalleryModal({ listing, initialIndex = 0, onClose }: PropertyGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, listing]);

  const mediaItems: MediaItem[] = [];
  if (listing) {
    const imgs = listing.images && listing.images.length > 0 ? listing.images : [listing.image];
    imgs.forEach((url, i) => {
      mediaItems.push({ type: "image", url, label: `Photo ${i + 1}` });
    });
    if (listing.videos && listing.videos.length > 0) {
      listing.videos.forEach((url, i) => {
        mediaItems.push({ type: "video", url, label: `Video ${i + 1}` });
      });
    }
  }

  // Prevent background scrolling while modal is open & keyboard navigation
  useEffect(() => {
    if (!listing) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
      }
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [listing, mediaItems.length, onClose]);

  if (!listing) return null;
  const currentMedia = mediaItems[currentIndex] ?? mediaItems[0];
  if (!currentMedia) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${listing.city}, ${listing.state} media gallery`}
      onClick={(e) => {
        // Clicking backdrop outside the card closes the popup
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-200 select-none overflow-y-auto"
    >
      {/* Centered Floating Luxury Card Modal Popup */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-4xl xl:max-w-5xl max-h-[92vh] rounded-2xl border border-primary/45 bg-[#121214]/95 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(190,149,67,0.22)] backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Gold Frame Sheen Ring */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/25 z-40" />

        {/* Modal Top Header Bar */}
        <div className="relative z-30 flex items-center justify-between px-5 py-3.5 sm:px-7 sm:py-4 border-b border-primary/20 bg-black/60 backdrop-blur-xl">
          <div className="flex flex-col gap-1 min-w-0 pr-4">
            <h2 className="font-display text-lg sm:text-2xl text-foreground font-light tracking-wide truncate">
              {listing.city}, {listing.state} {listing.zip}
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
              {listing.price && (
                <span className="font-mono font-medium text-primary text-sm sm:text-base">{listing.price}</span>
              )}
              {listing.beds && <span>{listing.beds} Beds</span>}
              {listing.baths && <span>· {listing.baths} Baths</span>}
              {listing.area && <span>· {listing.area} sq ft</span>}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full border border-primary/35 bg-black/60 px-3 py-1 text-xs font-mono tracking-widest text-primary font-semibold shadow-sm">
              <Sparkles className="size-3 text-primary animate-pulse" />
              <span>
                {String(currentIndex + 1).padStart(2, "0")} / {String(mediaItems.length).padStart(2, "0")}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close popup"
              className="group flex size-9 sm:size-10 items-center justify-center rounded-full border border-primary/40 bg-black/70 text-foreground transition-all duration-200 hover:border-primary hover:bg-primary hover:text-black hover:scale-105 active:scale-95 shadow-md"
            >
              <X className="size-4 sm:size-5 transition-transform group-hover:rotate-90 duration-200" />
            </button>
          </div>
        </div>

        {/* Media Stage inside Floating Card */}
        <div className="relative flex flex-1 items-center justify-center bg-black/90 overflow-hidden min-h-[300px] sm:min-h-[420px] md:min-h-[480px] max-h-[60vh] sm:max-h-[65vh] p-2 sm:p-4">
          {mediaItems.length > 1 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1))}
              aria-label="Previous media"
              className="absolute left-3 sm:left-5 z-30 flex size-10 sm:size-12 items-center justify-center rounded-full border border-primary/40 bg-black/80 text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(190,149,67,0.25)] backdrop-blur-md transition-all duration-200 hover:border-primary hover:bg-primary hover:text-black hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>
          )}

          <div className="relative flex size-full items-center justify-center overflow-hidden rounded-xl">
            {currentMedia.type === "video" ? (
              <video
                key={currentMedia.url}
                src={currentMedia.url}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                playsInline
                autoPlay
                className="max-h-[58vh] sm:max-h-[63vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              <img
                key={currentMedia.url}
                src={currentMedia.url}
                alt={`${listing.city}, ${listing.state} - ${currentMedia.label}`}
                className="max-h-[58vh] sm:max-h-[63vh] w-auto max-w-full object-contain rounded-xl transition-all duration-300 ease-out select-none shadow-2xl"
              />
            )}
          </div>

          {mediaItems.length > 1 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0))}
              aria-label="Next media"
              className="absolute right-3 sm:right-5 z-30 flex size-10 sm:size-12 items-center justify-center rounded-full border border-primary/40 bg-black/80 text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(190,149,67,0.25)] backdrop-blur-md transition-all duration-200 hover:border-primary hover:bg-primary hover:text-black hover:scale-105 active:scale-95"
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>
          )}
        </div>

        {/* Thumbnail Carousel or Info Footer */}
        {mediaItems.length > 1 ? (
          <div className="relative z-30 flex items-center justify-center gap-2.5 sm:gap-3 px-4 py-3 border-t border-primary/20 bg-black/75 backdrop-blur-xl overflow-x-auto">
            {mediaItems.map((item, idx) => (
              <button
                key={`${item.url}-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`View ${item.label}`}
                className={`relative size-12 sm:size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  currentIndex === idx
                    ? "border-primary shadow-[0_0_16px_rgba(190,149,67,0.55)] scale-105 opacity-100"
                    : "border-primary/20 opacity-60 hover:opacity-100 hover:border-primary/50"
                }`}
              >
                {item.type === "video" ? (
                  <div className="flex size-full flex-col items-center justify-center bg-black/90 p-1 text-primary">
                    <Play className="size-4 fill-primary text-primary" />
                    <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider">Video</span>
                  </div>
                ) : (
                  <img src={item.url} alt={`Thumbnail ${idx + 1}`} className="size-full object-cover" />
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
