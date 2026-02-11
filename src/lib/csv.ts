/**
 * CSV Export Utility
 * สร้าง CSV string จากข้อมูล
 */

interface CsvColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number | null | undefined);
}

/**
 * สร้าง CSV string จากข้อมูล
 * @param data - array ของข้อมูล
 * @param columns - column definitions
 * @returns CSV string พร้อม BOM สำหรับ Excel ภาษาไทย
 */
export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  // BOM for UTF-8 (ให้ Excel เปิดภาษาไทยได้)
  const BOM = "\uFEFF";

  // Header row
  const headerRow = columns.map((col) => escapeCsvValue(col.header)).join(",");

  // Data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const value =
          typeof col.accessor === "function"
            ? col.accessor(row)
            : row[col.accessor];
        return escapeCsvValue(String(value ?? ""));
      })
      .join(",");
  });

  return BOM + [headerRow, ...dataRows].join("\n");
}

/**
 * Escape ค่าสำหรับ CSV
 */
function escapeCsvValue(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * สร้าง Response object สำหรับ CSV download
 */
export function createCsvResponse(
  csvContent: string,
  filename: string
): Response {
  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
