import React, { useEffect, useRef, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt unmuted playback for the full audio experience
    video.muted = false;
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented audio, fallback to muted autoplay
        if (video) {
          video.muted = true;
          video.play().catch(console.error);
        }
      });
    }

    // Safety fallback timeout in case video fails to fire onEnded
    const fallbackTimer = setTimeout(() => {
      handleDismiss();
    }, 4500);

    return () => clearTimeout(fallbackTimer);
  }, []);

  const handleDismiss = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer select-none transition-opacity duration-600 ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Video Container */}
      <div className="relative w-full h-full max-w-4xl max-h-[85vh] flex items-center justify-center p-4">
        <video
          ref={videoRef}
          src="/splash_video.mp4"
          playsInline
          autoPlay
          onEnded={handleDismiss}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Skip button in bottom-right corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute bottom-6 right-8 text-[11px] text-zinc-500 hover:text-white px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 transition-colors uppercase tracking-wider font-semibold"
      >
        Skip
      </button>
    </div>
  );
};
