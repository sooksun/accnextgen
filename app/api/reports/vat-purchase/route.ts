import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMonthDateRange } from "@/src/lib/monthLock";
import { generateCsv, createCsvResponse } from "@/src/lib/csv";

/**
 * GET /api/reports/vat-purchase?year=2026&month=2&format=csv
 * รายงานภาษีซื้อรายเดือน (Expense ที่มี VAT)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const format = searchParams.get("format");

    const { startDate, endDate } = getMonthDateRange(year, month);

    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        hasVat: true,
      },
      orderBy: { expenseDate: "asc" },
    });

    if (format === "csv") {
      const csv = generateCsv(expenses, [
        { header: "ลำดับ", accessor: () => "" },
        { header: "วันที่", accessor: (row) => new Date(row.expenseDate).toLocaleDateString("th-TH") },
        { header: "ผู้ขาย/ร้านค้า", accessor: "vendorName" },
        { header: "หมวดหมู่", accessor: "category" },
        { header: "รายละเอียด", accessor: (row) => row.description ?? "" },
        { header: "มูลค่าฐานภาษี", accessor: (row) => Number(row.subTotal).toFixed(2) },
        { header: "ภาษีมูลค่าเพิ่ม", accessor: (row) => Number(row.vatAmount).toFixed(2) },
        { header: "ยอดรวม", accessor: (row) => Number(row.grandTotal).toFixed(2) },
      ]);

      return createCsvResponse(
        csv,
        `vat-purchase-${year}-${String(month).padStart(2, "0")}.csv`
      );
    }

    const summary = expenses.reduce(
      (acc, exp) => ({
        subTotal: acc.subTotal + Number(exp.subTotal),
        vatAmount: acc.vatAmount + Number(exp.vatAmount),
        grandTotal: acc.grandTotal + Number(exp.grandTotal),
      }),
      { subTotal: 0, vatAmount: 0, grandTotal: 0 }
    );

    return NextResponse.json({
      period: { year, month },
      data: expenses,
      summary,
      count: expenses.length,
    });
  } catch (error) {
    console.error("GET /api/reports/vat-purchase error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
