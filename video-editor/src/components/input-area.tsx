import { Button, Input } from "@heroui/react";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  useExtCommand,
  useImageGen,
  useVideoGen,
} from "@pulse-editor/react-api";
import {
  generateImageCommandInfo,
  generateVideoCommandInfo,
} from "../lib/commands";

export default function InputArea({
  setImage,
  setVideo,
  isGeneratingImage,
  setIsGeneratingImage,
  isGeneratingVideo,
  setIsGeneratingVideo,
}: {
  setImage: Dispatch<SetStateAction<ArrayBuffer | undefined>>;
  setVideo: Dispatch<SetStateAction<ArrayBuffer | undefined>>;
  isGeneratingImage: boolean;
  setIsGeneratingImage: Dispatch<SetStateAction<boolean>>;
  isGeneratingVideo: boolean;
  setIsGeneratingVideo: Dispatch<SetStateAction<boolean>>;
}) {
  const [userInput, setUserInput] = useState("");
  const { runImageGen } = useImageGen();
  const { runVideoGen } = useVideoGen();
  const {
    updateHandler: updateImageCommandHandler,
    isReady: isImageCommandReady,
  } = useExtCommand(generateImageCommandInfo);
  const {
    updateHandler: updateVideoCommandHandler,
    isReady: isVideoCommandReady,
  } = useExtCommand(generateVideoCommandInfo);

  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isImageCommandReady) {
      updateImageCommandHandler(async ({ prompt }: { prompt: string }) => {
        setUserInput(() => prompt);
        await generateImage(prompt);

        return "Generated image successfully";
      });
    }
  }, [isImageCommandReady, isGeneratingImage]);

  useEffect(() => {
    if (isVideoCommandReady) {
      updateVideoCommandHandler(async ({ prompt }: { prompt: string }) => {
        setUserInput(() => prompt);
        await generateVideo(prompt);

        return "Generated video successfully";
      });
    }
  }, [isVideoCommandReady, isGeneratingImage]);

  async function generateImage(prompt: string) {
    if (isGeneratingImage) {
      return;
    }

    setIsGeneratingImage(true);
    console.log("Generating image with prompt:", prompt);
    const { arrayBuffer: result, url } = await runImageGen(prompt);
    setImageUrl(url);
    setIsGeneratingImage(false);

    if (result) {
      setImage(result);
    } else {
      console.error("Image generation failed");
      setImage(undefined);
    }
  }

  async function generateVideo(prompt: string) {
    if (isGeneratingVideo || isGeneratingImage) {
      return;
    }

    setIsGeneratingVideo(true);
    console.log("Generating video with prompt:", prompt);
    const { arrayBuffer: result } = await runVideoGen(5, prompt, imageUrl);
    setIsGeneratingVideo(false);

    if (result) {
      setVideo(result);
    } else {
      console.error("Video generation failed");
      setVideo(undefined);
    }
  }

  return (
    <div className="flex flex-col h-full w-full gap-1">
      <Input
        value={userInput}
        onValueChange={setUserInput}
        label="Text prompt"
      />
      <div className="w-full flex gap-4 justify-center">
        <Button onPress={() => generateImage(userInput)}>
          Generate 1st Frame Image
        </Button>
        <Button onPress={() => generateVideo(userInput)}>Generate Video</Button>
      </div>
    </div>
  );
}
