import ExcelJS from "exceljs";
import type { SourceDocument } from "@/lib/anthropic";

const DIRECT_MEDIA_TYPES: Record<string, SourceDocument["mediaType"]> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  txt: "text/plain",
};

/**
 * Claude reads PDFs and images natively but not .xlsx/.xls — rate contracts
 * that arrive as Excel get flattened to a plain-text sheet dump first so the
 * rest of the pipeline only has to deal with document/image/text inputs.
 */
export async function prepareSourceDocument(
  filename: string,
  data: Buffer
): Promise<SourceDocument> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "xlsx" || ext === "xls") {
    const text = await excelToText(data);
    return { data: Buffer.from(text, "utf-8"), mediaType: "text/plain", filename };
  }

  const mediaType = DIRECT_MEDIA_TYPES[ext];
  if (!mediaType) {
    throw new Error(
      `Unsupported file type ".${ext}". Upload a PDF, JPG, PNG, Excel (.xlsx/.xls), or plain text extract.`
    );
  }
  return { data, mediaType, filename };
}

async function excelToText(data: Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data as unknown as ArrayBuffer);

  const sheets: string[] = [];
  workbook.eachSheet((sheet) => {
    const rows: string[] = [`--- Sheet: ${sheet.name} ---`];
    sheet.eachRow((row) => {
      const cells = (row.values as unknown[]).slice(1).map((cell) => cellToString(cell));
      rows.push(cells.join("\t"));
    });
    sheets.push(rows.join("\n"));
  });
  return sheets.join("\n\n");
}

function cellToString(cell: unknown): string {
  if (cell == null) return "";
  if (typeof cell === "object" && "text" in (cell as Record<string, unknown>)) {
    return String((cell as { text: unknown }).text ?? "");
  }
  if (typeof cell === "object" && "result" in (cell as Record<string, unknown>)) {
    return String((cell as { result: unknown }).result ?? "");
  }
  return String(cell);
}
