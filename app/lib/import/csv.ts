// Browser-side CSV parser. Handles quoted fields, embedded commas/newlines.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (c !== "\r") {
        cell += c;
      }
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
/**
 * Read a CSV file as text, handling the two encodings that Excel produces
 * in practice:
 *   - UTF-8 (with or without BOM) — modern Excel / Google Sheets
 *   - Windows-1252 — Excel's default on Windows, which contains £, €, smart
 *     quotes, and other single-byte characters that are invalid in UTF-8.
 * Browser `File.text()` always assumes UTF-8, so mojibake like "�119.00"
 * ends up in the parsed text and breaks every subsequent price/qty check.
 */
export async function readCsvFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let bytes = new Uint8Array(buf);

  // Strip UTF-8 BOM if present
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    bytes = bytes.subarray(3);
  }

  // Try strict UTF-8 first
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // Fall back — this is what Excel-on-Windows actually produces
    return new TextDecoder("windows-1252").decode(bytes);
  }
}
