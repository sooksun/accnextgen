import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMonthDateRange } from "@/src/lib/monthLock";

/**
 * GET /api/reports/wht-detail?year=2026&month=2
 * รายละเอียด WHT เพื่อเตรียมนำส่ง + ตรวจสอบใบรับรอง
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

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
            customer: { select: { name: true, taxId: true, address: true } },
          },
        },
      },
      orderBy: {
        document: { issueDate: "asc" },
      },
    });

    const details = whtRecords.map((wht) => ({
      customerName: wht.document.customer.name,
      customerTaxId: wht.document.customer.taxId,
      documentNumber: wht.document.number,
      issueDate: wht.document.issueDate,
      baseAmount: Number(wht.baseAmount),
      taxAmount: Number(wht.taxAmount),
      rate: Number(wht.rate),
      certificateNo: wht.certificateNo,
      certificateDate: wht.certificateDate,
      status: wht.certificateNo ? "completed" : "missing_certificate",
    }));

    const summary = {
      totalBaseAmount: details.reduce((sum, d) => sum + d.baseAmount, 0),
      totalTaxAmount: details.reduce((sum, d) => sum + d.taxAmount, 0),
      totalRecords: details.length,
      missingCertificates: details.filter(
        (d) => d.status === "missing_certificate"
      ).length,
      completedCertificates: details.filter((d) => d.status === "completed")
        .length,
    };

    return NextResponse.json({
      period: { year, month },
      data: details,
      summary,
    });
  } catch (error) {
    console.error("GET /api/reports/wht-detail error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
