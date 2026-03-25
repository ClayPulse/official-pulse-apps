import mammoth from "mammoth";
import * as XLSX from "xlsx";

interface UploadedFile {
  name: string;
  base64: string;
}

interface ParsedFile {
  name: string;
  extension: string;
  content: string;
}

export default async function uploadFiles(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { files } = (await req.json()) as { files: UploadedFile[] };
    const results: ParsedFile[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const buffer = Buffer.from(file.base64, "base64");
      let content: string;

      switch (ext) {
        case "txt":
        case "md":
        case "csv":
        case "json":
        case "xml":
        case "html":
        case "css":
        case "js":
        case "ts":
        case "tsx":
        case "jsx":
          content = buffer.toString("utf-8");
          break;

        case "docx": {
          const result = await mammoth.extractRawText({ buffer });
          content = result.value;
          break;
        }

        case "xlsx":
        case "xls": {
          const workbook = XLSX.read(buffer, { type: "buffer" });
          const sheets: string[] = [];
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
          }
          content = sheets.join("\n\n");
          break;
        }

        default:
          content = `[Unsupported file type: .${ext}]`;
          break;
      }

      results.push({ name: file.name, extension: ext, content });
    }

    return new Response(JSON.stringify({ files: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
