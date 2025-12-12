import { Skeleton } from "@heroui/react";
import React, { useEffect, useState } from "react";

export default function VideoViewport({
  video,
  isGenerating,
}: {
  video: ArrayBuffer | undefined;
  isGenerating: boolean;
}) {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (video) {
      const blob = new Blob([video], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    }
  }, [video]);

  return (
    <div className="w-full h-full rounded-xl bg-content1 overflow-hidden">
      {videoUrl || isGenerating ? (
        <Skeleton
          className="w-full h-full"
          isLoaded={!isGenerating}
          classNames={{
            content: "w-full h-full flex justify-center items-center",
          }}
        >
          {videoUrl && (
            <video
              src={videoUrl}
              className="max-w-full max-h-full object-contain rounded-xl"
              controls
              autoPlay
              loop
              muted
            />
          )}
        </Skeleton>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-center">
          Enter text and image prompt or use voice input to generate a video.
        </div>
      )}
    </div>
  );
}
