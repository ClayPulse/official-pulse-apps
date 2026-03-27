/**
 * @typedef {Object} Input - The input parameters for the get-opened-note action.
 * @property {string} [title] - The title of the currently opened meeting note.
 * @property {string} [note] - The note content of the currently opened meeting.
 * @property {string} [transcript] - The transcript of the currently opened meeting (if available).
 */
type Input = {
  title?: string;
  note?: string;
  transcript?: string;
};

/**
 * @typedef {Object} Output - The output of the get-opened-note action.
 * @property {string} title - The title of the currently opened meeting note.
 * @property {string} note - The note content of the currently opened meeting.
 * @property {string} transcript - The transcript of the currently opened meeting (empty string if not available).
 */
type Output = {
  title: string;
  note: string;
  transcript: string;
};

/**
 * Returns the meeting note currently opened in the UI.
 * The title, note, and transcript are injected by the frontend via useActionEffect beforeAction.
 *
 * @param {Input} input - The input parameters populated by the frontend.
 *
 * @returns {Output} The currently opened meeting note data.
 */
export default function getOpenedNote({
  title = "",
  note = "",
  transcript = "",
}: Input): Output {
  return { title, note, transcript };
}
