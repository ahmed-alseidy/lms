"use client";

import MuxPlayer from "@mux/mux-player-react";

export const MuxVideoPlayer = ({ playbackId }: { playbackId: string }) => (
  console.log(playbackId),
  (
    <MuxPlayer
      className="h-full w-full"
      playbackId={playbackId}
      streamType="on-demand"
    />
  )
);
