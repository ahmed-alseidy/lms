"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { cn } from "@/lib/utils";

interface VideoJsPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  onComplete?: () => void;
}

export const VideoJsPlayer = ({
  src,
  poster,
  className,
  onComplete,
}: VideoJsPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (playerRef.current) {
      return;
    }

    // Wait for the next tick to ensure the video element is in the DOM
    const timer = setTimeout(() => {
      if (!videoRef.current) return;

      // Initialize Video.js player
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: "auto",
        poster: poster,
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2],
        html5: {
          hls: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: true,
          },
        },
        controllerBar: {
          children: {
            downloadButton: false,
            pictureInPictureToggle: false,
          },
        },
      });

      playerRef.current = player;

      // Set source
      player.src({
        src: src,
        type: "application/x-mpegURL", // For HLS streams
      });

      // Handle video end
      player.on("ended", async () => {
        onComplete?.();
      });

      // Prevent right-click context menu
      const preventDownload = (e: MouseEvent) => {
        e.preventDefault();
      };

      // Prevent keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "s" || e.key === "c" || e.key === "u")
        ) {
          e.preventDefault();
        }
      };

      // Add event listeners
      videoRef.current.addEventListener("contextmenu", preventDownload);
      videoRef.current?.addEventListener("dragstart", preventDownload);

      document.addEventListener("keydown", handleKeyDown);

      if (videoRef.current?.requestPictureInPicture) {
        videoRef.current.requestPictureInPicture = () =>
          Promise.reject(new Error("Picture-in-Picture is disabled"));
      }

      // Cleanup function
      return () => {
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.removeEventListener("contextmenu", preventDownload);
        }
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [src, poster, onComplete]);

  return (
    <div className={cn("relative", className)}>
      <div className="h-full" data-vjs-player>
        <video
          className="video-js vjs-big-play-centered h-full w-full"
          onContextMenu={(e) => e.preventDefault()}
          ref={videoRef}
        />
      </div>
    </div>
  );
};
