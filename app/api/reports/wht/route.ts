import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMonthDateRange } from "@/src/lib/monthLock";
import { generateCsv, createCsvResponse } from "@/src/lib/csv";

/**
 * GET /api/reports/wht?year=2026&month=2&format=csv
 * รายงาน WHT (ภาษีหัก ณ ที่จ่าย) รายเดือน
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const format = searchParams.get("format");

    const { startDate, endDate } = getMonthDateRange(year, month);

    const whtRecords = await prisma.withholdingTax.findMany({
      where: {
        document: {
          issueDate: { gte: startDate, lte: endDate },
        },
      },
      include: {
        document: {
          include: {
            customer: { select: { name: true, taxId: true } },
          },
        },
      },
      orderBy: {
        document: { issueDate: "asc" },
      },
    });

    if (format === "csv") {
      const csv = generateCsv(whtRecords, [
        { header: "ลำดับ", accessor: () => "" },
        { header: "วันที่เอกสาร", accessor: (row) => new Date(row.document.issueDate).toLocaleDateString("th-TH") },
        { header: "เลขที่เอกสาร", accessor: (row) => row.document.number },
        { header: "ชื่อลูกค้า", accessor: (row) => row.document.customer.name },
        { header: "เลขผู้เสียภาษี", accessor: (row) => row.document.customer.taxId ?? "" },
        { header: "อัตรา (%)", accessor: (row) => Number(row.rate).toFixed(2) },
        { header: "ฐานภาษี", accessor: (row) => Number(row.baseAmount).toFixed(2) },
        { header: "ภาษีถูกหัก", accessor: (row) => Number(row.taxAmount).toFixed(2) },
        { header: "เลขรับรอง", accessor: (row) => row.certificateNo ?? "" },
        { header: "วันที่รับรอง", accessor: (row) => row.certificateDate ? new Date(row.certificateDate).toLocaleDateString("th-TH") : "" },
      ]);

      return createCsvResponse(
        csv,
        `wht-report-${year}-${String(month).padStart(2, "0")}.csv`
      );
    }

    const summary = whtRecords.reduce(
      (acc, wht) => ({
        baseAmount: acc.baseAmount + Number(wht.baseAmount),
        taxAmount: acc.taxAmount + Number(wht.taxAmount),
      }),
      { baseAmount: 0, taxAmount: 0 }
    );

    return NextResponse.json({
      period: { year, month },
      data: whtRecords,
      summary,
      count: whtRecords.length,
    });
  } catch (error) {
    console.error("GET /api/reports/wht error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
