import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMonthDateRange } from "@/src/lib/monthLock";
import { generateCsv, createCsvResponse } from "@/src/lib/csv";

/**
 * GET /api/reports/vat-sales?year=2026&month=2&format=csv
 * รายงานภาษีขายรายเดือน
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const format = searchParams.get("format");

    const { startDate, endDate } = getMonthDateRange(year, month);

    const documents = await prisma.document.findMany({
      where: {
        type: "TAX_INVOICE_RECEIPT",
        issueDate: { gte: startDate, lte: endDate },
      },
      include: {
        customer: { select: { name: true, taxId: true } },
      },
      orderBy: { issueDate: "asc" },
    });

    if (format === "csv") {
      const csv = generateCsv(documents, [
        { header: "ลำดับ", accessor: (_row: typeof documents[0], ) => "" },
        { header: "วันที่", accessor: (row) => new Date(row.issueDate).toLocaleDateString("th-TH") },
        { header: "เลขที่เอกสาร", accessor: "number" },
        { header: "ชื่อลูกค้า", accessor: (row) => row.customer.name },
        { header: "เลขผู้เสียภาษี", accessor: (row) => row.customer.taxId ?? "" },
        { header: "มูลค่าฐานภาษี", accessor: (row) => Number(row.subTotal).toFixed(2) },
        { header: "ภาษีมูลค่าเพิ่ม", accessor: (row) => Number(row.vatAmount).toFixed(2) },
        { header: "ยอดรวม", accessor: (row) => Number(row.grandTotal).toFixed(2) },
      ]);

      // Add row numbers
      const lines = csv.split("\n");
      const header = lines[0];
      const dataLines = lines.slice(1).map((line, idx) => {
        return `${idx + 1},${line.substring(line.indexOf(",") + 1)}`;
      });

      return createCsvResponse(
        [header, ...dataLines].join("\n"),
        `vat-sales-${year}-${String(month).padStart(2, "0")}.csv`
      );
    }

    // JSON response
    const summary = documents.reduce(
      (acc, doc) => ({
        subTotal: acc.subTotal + Number(doc.subTotal),
        vatAmount: acc.vatAmount + Number(doc.vatAmount),
        grandTotal: acc.grandTotal + Number(doc.grandTotal),
      }),
      { subTotal: 0, vatAmount: 0, grandTotal: 0 }
    );

    return NextResponse.json({
      period: { year, month },
      data: documents,
      summary,
      count: documents.length,
    });
  } catch (error) {
    console.error("GET /api/reports/vat-sales error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
