import React, { useCallback, useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

interface ParsedFile {
  name: string;
  extension: string;
  content: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [isDragging, setIsDragging] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  const { runAppAction } = useActionEffect(
    {
      actionName: "upload-files",
      beforeAction: async (args: any) => {
        if (!args) return args;
        if (!args.files || args.files.length === 0) {
          // No new files — pass through, afterAction will inject UI files
          return args;
        }
        setIsUploading(true);
        setError(null);
        return args;
      },
      afterAction: async (result: any) => {
        setIsUploading(false);
        // If action returned no files (no input files), return the UI's parsed files
        if (!result?.files || result.files.length === 0) {
          return { files: parsedFiles };
        }
        setParsedFiles((prev) => [...prev, ...result.files]);
        return result;
      },
    },
    [parsedFiles],
  );

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (!runAppAction) return;
      setIsUploading(true);
      setError(null);

      try {
        for (const f of Array.from(fileList)) {
          if (f.size > MAX_FILE_SIZE) {
            setError(`"${f.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit and was skipped.`);
            continue;
          }
          const base64 = await fileToBase64(f);
          const result = await runAppAction({ files: [{ name: f.name, base64 }] });
          if (result?.files) {
            setParsedFiles((prev) => [...prev, ...result.files]);
          }
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsUploading(false);
      }
    },
    [runAppAction],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="p-3 flex flex-col w-full h-full overflow-hidden gap-y-3 text-sm">
      <h1 className="text-lg font-semibold">File Upload</h1>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex-1 flex flex-col items-center justify-center ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.tsx,.jsx,.docx,.xlsx,.xls";
          input.onchange = () => {
            if (input.files && input.files.length > 0) {
              handleFiles(input.files);
            }
          };
          input.click();
        }}
      >
        {isUploading ? (
          <p className="text-gray-500">Parsing files...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">
              Drag & drop files here
            </p>
            <p className="text-gray-400 text-xs mt-1">
              or click to browse. Max {MAX_FILE_SIZE_MB}MB per file. Supports .txt, .md, .csv, .json, .docx, .xlsx, and more
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}

      {/* Results */}
      {parsedFiles.length > 0 && (
        <div className="flex flex-col min-h-0 flex-1 border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
            <h2 className="font-semibold text-sm">
              Parsed Files ({parsedFiles.length})
            </h2>
          </div>
          <div className="overflow-y-auto divide-y divide-gray-100">
            {parsedFiles.map((file, i) => (
              <details key={i} className="group">
                <summary className="flex items-center gap-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 select-none">
                  <span className="text-xs text-gray-400 group-open:rotate-90 transition-transform">&#9654;</span>
                  <span className="font-medium truncate">{file.name}</span>
                  <span className="text-xs bg-gray-200 rounded px-1.5 py-0.5 shrink-0">
                    .{file.extension}
                  </span>
                  <button
                    className="ml-auto shrink-0 text-gray-400 hover:text-red-500 text-xs px-1"
                    onClick={(e) => {
                      e.preventDefault();
                      setParsedFiles((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                  >
                    ✕
                  </button>
                </summary>
                <pre className="text-xs bg-white border-t border-gray-100 px-3 py-2 max-h-48 overflow-auto whitespace-pre-wrap break-words">
                  {file.content}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
