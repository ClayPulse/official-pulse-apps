import React from "react";
import {
  renderToBuffer,
  Document,
  Page,
  StyleSheet,
} from "@react-pdf/renderer";
import Html from "react-pdf-html";

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingLeft: 55,
    paddingRight: 55,
    fontSize: 10.5,
    color: "#262626",
    lineHeight: 1.55,
  },
});

const htmlStylesheet = {
  h1: {
    fontSize: 26,
    color: "#1a1a1e",
    marginBottom: 10,
    marginTop: 10,
  },
  h2: {
    fontSize: 18,
    color: "#294a8c",
    marginBottom: 8,
    marginTop: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e3ea",
    paddingBottom: 4,
  },
  h3: {
    fontSize: 14,
    color: "#1a1a1e",
    marginBottom: 6,
    marginTop: 14,
  },
  h4: {
    fontSize: 12,
    color: "#73737f",
    marginBottom: 4,
    marginTop: 10,
  },
  h5: {
    fontSize: 11,
    color: "#73737f",
    marginBottom: 4,
    marginTop: 10,
  },
  h6: {
    fontSize: 10.5,
    color: "#73737f",
    marginBottom: 4,
    marginTop: 10,
  },
  p: {
    marginBottom: 8,
    marginTop: 2,
  },
  a: {
    color: "#2161ba",
    textDecoration: "underline",
  },
  strong: {},
  b: {},
  em: {},
  i: {},
  blockquote: {
    borderLeftWidth: 3.5,
    borderLeftColor: "#294a8c",
    backgroundColor: "#f2f4f8",
    paddingLeft: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
    marginBottom: 10,
    marginTop: 10,
    color: "#4d4d60",
    fontSize: 11,
  },
  pre: {
    fontSize: 9.5,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    marginTop: 8,
  },
  code: {
    fontSize: 9.5,
  },
  hr: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d6e0",
    marginTop: 14,
    marginBottom: 14,
  },
  ul: {
    marginBottom: 6,
    marginTop: 4,
    paddingLeft: 20,
  },
  ol: {
    marginBottom: 6,
    marginTop: 4,
    paddingLeft: 20,
  },
  li: {
    marginBottom: 3,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
  },
  th: {
    backgroundColor: "#294a8c",
    color: "#ffffff",
    padding: 8,
    fontSize: 10.5,
  },
  td: {
    padding: 8,
    fontSize: 10.5,
    borderBottomWidth: 0.3,
    borderBottomColor: "#e0e3ea",
  },
  tr: {},
  img: {
    maxWidth: "100%",
    marginTop: 6,
    marginBottom: 6,
  },
};

/** Strip all font-related CSS properties from HTML inline styles and <style> blocks */
function stripFontStyles(html: string): string {
  // Remove font properties from inline style attributes
  let result = html.replace(/style="([^"]*)"/gi, (match, styleContent) => {
    const cleaned = styleContent
      .replace(/font-family\s*:[^;"]*(;|(?="))/gi, "")
      .replace(/fontFamily\s*:[^;"]*(;|(?="))/gi, "")
      .replace(/font-weight\s*:[^;"]*(;|(?="))/gi, "")
      .replace(/fontWeight\s*:[^;"]*(;|(?="))/gi, "")
      .replace(/font-style\s*:[^;"]*(;|(?="))/gi, "")
      .replace(/fontStyle\s*:[^;"]*(;|(?="))/gi, "")
      .trim();
    return cleaned ? `style="${cleaned}"` : "";
  });

  // Remove font properties from <style> blocks
  result = result.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, content) => {
    const cleaned = content
      .replace(/font-family\s*:[^;]*(;)/gi, "")
      .replace(/fontFamily\s*:[^;]*(;)/gi, "")
      .replace(/font-weight\s*:[^;]*(;)/gi, "")
      .replace(/fontWeight\s*:[^;]*(;)/gi, "")
      .replace(/font-style\s*:[^;]*(;)/gi, "")
      .replace(/fontStyle\s*:[^;]*(;)/gi, "");
    return `<style>${cleaned}</style>`;
  });

  return result;
}

const h = React.createElement;

/** Unwrap HTML from markdown code blocks if present */
function unwrapCodeBlock(input: string): string {
  const trimmed = input.trim();
  // Match ```html ... ``` or ``` ... ```
  const match = trimmed.match(/^```(?:html)?\s*\n([\s\S]*?)\n\s*```$/);
  return match ? match[1] : trimmed;
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const unwrapped = unwrapCodeBlock(html);
  const cleanedHtml = stripFontStyles(unwrapped);

  const document = h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page } as any,
      h(Html, { stylesheet: htmlStylesheet } as any, cleanedHtml),
    ),
  );

  const buffer = await renderToBuffer(document as any);
  return new Uint8Array(buffer);
}
