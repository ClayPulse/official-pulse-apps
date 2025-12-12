import React, { useEffect, useState } from "react";
import "./tailwind.css";
import config from "../pulse.config";
import { useLoading } from "@pulse-editor/react-api";
import { WrappedHeroUIProvider } from "./components/providers/wrapped-hero-ui-provider";
import { addToast, Button, Divider, Spinner, Textarea } from "@heroui/react";

export const Config = config;

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  const [lyrics, setLyrics] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");

  // The music to be played in a player
  const [musicUrl, setMusicUrl] = useState<string | undefined>(undefined);

  const [predictionId, setPredictionId] = useState<string | undefined>(
    undefined
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [keywords, setKeywords] = useState<string>("");

  async function generateMusic(prompt: string, lyrics: string) {
    setMusicUrl(undefined);
    setPredictionId(undefined);
    const res = await fetch(
      "https://pulse-editor.com/api/inference/runpod/run",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          modelName: "text2audio/ace-step",
          payload: {
            prompt,
            lyrics,
          },
        }),
        credentials: "include",
      }
    );

    if (!res.ok) {
      console.error("Failed to generate music:", res.statusText);
      return;
    }

    const { id }: { id: string } = await res.json();
    setPredictionId(id);

    console.log("Prediction ID:", id);
  }

  async function generateStyleAndLyrics(keywords: string) {
    function parseJsonChunk(chunk: string) {
      const jsonObjects = [];
      // Replace multiple spaces or other delimiters with a single space and trim
      const cleanedChunk = chunk.trim();

      // Use a regular expression to match JSON objects
      // This assumes objects are separated by spaces and are valid JSON
      const jsonRegex = /({[^{}]*})/g;
      const matches = cleanedChunk.match(jsonRegex);

      if (matches) {
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match);
            jsonObjects.push(parsed);
          } catch (error) {
            console.error("Error parsing JSON object:", match, error);
          }
        }
      }

      return jsonObjects;
    }

    if (keywords === "") {
      addToast({
        title: "Please enter keywords",
        color: "warning",
        timeout: 3000,
      });

      return;
    }

    setIsGenerating(true);
    const res = await fetch(
      "https://pulse-editor.com/api/inference/lyrics-gen/run",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          keywords,
        }),
        credentials: "include",
      }
    );

    if (!res.ok) {
      console.error("Failed to generate lyrics:", res.statusText);
      return;
    }

    const stream = res.body;

    if (!stream) {
      console.error("No response body received");
      return;
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");
    let finalPrompt = "";
    let finalLyrics = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      console.log("Received chunk:", chunk);

      // each chunk may contain multiple JSON objects, break them in to a list of json objects
      const jsons = parseJsonChunk(chunk);

      const latestJson = jsons[jsons.length - 1];

      const {
        prompt,
        lyrics,
      }: {
        prompt: string;
        lyrics: string;
      } = latestJson;

      setPrompt(prompt);
      setLyrics(lyrics);

      finalPrompt = prompt;
      finalLyrics = lyrics;
    }

    await generateMusic(finalPrompt, finalLyrics);
  }

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  useEffect(() => {
    async function checkStatus() {
      const res = await fetch(
        `https://pulse-editor.com/api/inference/runpod/status?id=${predictionId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!res.ok) {
        console.error("Failed to check status:", res.statusText);
        return;
      }

      const data = await res.json();

      if (data.status === "COMPLETED") {
        const url = data.output.url;
        setMusicUrl(url);
        setIsGenerating(false);
      } else {
        console.log("Prediction still in progress:", data.status);
        setTimeout(checkStatus, 500); // Check again after 5 seconds
      }
    }

    if (predictionId) {
      checkStatus();
    }
  }, [predictionId]);

  return (
    <WrappedHeroUIProvider>
      <div className="px-4 pt-2 pb-16 flex flex-col items-center gap-y-2">
        <h1 className="text-2xl font-bold">AI Music Generator</h1>
        <Textarea
          label="Keywords"
          placeholder="Enter keywords to generate lyrics and song, e.g., love, summer, party"
          value={keywords}
          onValueChange={setKeywords}
          maxRows={10}
        />

        <Button
          onPress={() => {
            generateStyleAndLyrics(keywords);
          }}
        >
          Generate Lyrics and Song 🎵
        </Button>

        <Divider />

        <Textarea
          label="Style"
          value={prompt}
          onValueChange={setPrompt}
          placeholder="Style of the song (e.g., pop, rock, etc.)"
          readOnly
          maxRows={5}
        />

        <Textarea
          label="Lyrics"
          value={lyrics}
          onValueChange={(val) => {
            // Break any \n into new lines
            setLyrics(val.replace(/\\n/g, "\n"));
          }}
          placeholder="The lyrics of the song"
          maxRows={20}
          readOnly
        />

        {isGenerating && <Spinner />}

        {/* Music player */}
        {musicUrl ? (
          <>
            <p className="text-green-500 text-center">
              Music generated successfully! 🎶
            </p>
            <audio controls>
              <source src={musicUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <Button
              color="primary"
              onPress={() => {
                const link = document.createElement("a");
                link.href = musicUrl;
                link.download = "generated_music.mp3";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download Music
            </Button>
          </>
        ) : (
          <div>
            <p className="text-red-500">No music generated yet.</p>
          </div>
        )}
      </div>
    </WrappedHeroUIProvider>
  );
}
