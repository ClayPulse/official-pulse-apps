/**
 * @typedef {Object} Input - The input parameters for the generate-pdf action.
 * @property {string} content - The text content to convert into a PDF document.
 */
type Input = {
  content: string;
};

/**
 * @typedef {Object} Output - The output of the generate-pdf action.
 * @property {string} pdf - The generated PDF as a base64-encoded string.
 */
type Output = {
  pdf: string;
};

/**
 * Generates a PDF document from the provided text content.
 * Calls the generate-pdf server function and returns the base64-encoded PDF.
 *
 * @param {Input} input - The input parameters containing the text content.
 *
 * @returns {Output} The output containing the base64-encoded PDF.
 */
export default async function generatePdf({
  content,
}: Input): Promise<Output> {
  const response = await fetch("/server-function/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PDF generation failed: ${error}`);
  }

  const data = await response.json();
  return { pdf: `data:application/pdf;base64,${data.pdf}` };
}
