import React, { useState } from "react";
import ImageViewport from "./viewports/image-viewport";
import InputArea from "./input-area";
import VideoViewport from "./viewports/video-viewport";
import { Divider } from "@heroui/react";

export default function EditorPanel() {
  const [image, setImage] = useState<ArrayBuffer | undefined>(undefined);
  const [video, setVideo] = useState<ArrayBuffer | undefined>(undefined);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  return (
    <div className="h-full w-full grid grid-rows-[auto_max-content] p-2 gap-2">
      <div className="w-full h-full grid grid-cols-[1fr_max-content_1fr] gap-1 overflow-hidden">
        <ImageViewport image={image} isGenerating={isGeneratingImage} />
        <Divider orientation="vertical" />
        <VideoViewport video={video} isGenerating={isGeneratingVideo} />
      </div>
      <InputArea
        setImage={setImage}
        setVideo={setVideo}
        isGeneratingImage={isGeneratingImage}
        setIsGeneratingImage={setIsGeneratingImage}
        isGeneratingVideo={isGeneratingVideo}
        setIsGeneratingVideo={setIsGeneratingVideo}
      />
    </div>
  );
}
