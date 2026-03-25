/**
 * @typedef {Object} Input - The input parameters for the upload-files action.
 * @property {Object[]} [files] - Optional array of files to upload and parse. Each file has a name (including extension) and base64-encoded content. If omitted, returns the files already uploaded via the UI.
 */
type Input = {
  files?: { name: string; base64: string }[];
};

/**
 * @typedef {Object} Output - The output of the upload-files action.
 * @property {Object[]} files - Array of parsed file results with name, extension, and extracted text content.
 */
type Output = {
  files: { name: string; extension: string; content: string }[];
};

/**
 * Upload files and parse their content, or return already-uploaded files from the UI.
 * If files are provided, sends them to the server function for parsing.
 * If no files are provided, returns the files already uploaded via the UI (injected by beforeAction).
 *
 * @param {Input} input - The files to upload and parse (optional).
 *
 * @returns {Promise<Output>} The parsed file contents.
 */
export default async function uploadFiles({ files }: Input): Promise<Output> {
  if (!files || files.length === 0) {
    // No files provided — beforeAction will have injected _parsedFiles
    // Return empty; the UI handles this via beforeAction/afterAction
    return { files: [] };
  }

  const response = await fetch("/server-function/upload-files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return { files: data.files };
}
