import { Skeleton } from "@heroui/react";
import React, { useEffect, useState } from "react";

export default function ImageViewport({
  isGenerating,
  image,
}: {
  isGenerating: boolean;
  image: ArrayBuffer | undefined;
}) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (image) {
      const blob = new Blob([image], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    }
  }, [image]);

  return (
    <div className="w-full h-full rounded-xl bg-content1 overflow-hidden">
      {imageUrl || isGenerating ? (
        <Skeleton
          className="w-full h-full"
          isLoaded={!isGenerating}
          classNames={{
            content: "w-full h-full flex justify-center items-center",
          }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          )}
        </Skeleton>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-center">
          Enter a prompt or use voice input to generate an image.
        </div>
      )}
    </div>
  );
}
