import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { closeMonth, isMonthClosed } from "@/src/lib/monthLock";

/**
 * GET /api/monthly-close - รายการเดือนที่ถูกปิด
 * POST /api/monthly-close - ปิดเดือน
 * DELETE /api/monthly-close?year=2026&month=2 - เปิดเดือน (reopen)
 */

// GET /api/monthly-close
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};
    if (year) where.year = parseInt(year);

    const closedMonths = await prisma.monthlyClose.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(closedMonths);
  } catch (error) {
    console.error("GET /api/monthly-close error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/monthly-close - ปิดเดือน
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, note } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: "กรุณาระบุปีและเดือน" },
        { status: 400 }
      );
    }

    const alreadyClosed = await isMonthClosed(year, month);
    if (alreadyClosed) {
      return NextResponse.json(
        { error: `เดือน ${month}/${year} ถูกปิดไปแล้ว` },
        { status: 409 }
      );
    }

    await closeMonth(year, month, note);

    return NextResponse.json(
      { message: `ปิดเดือน ${month}/${year} สำเร็จ` },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/monthly-close error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/monthly-close - เปิดเดือน (reopen)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? "0");
    const month = parseInt(searchParams.get("month") ?? "0");

    if (!year || !month) {
      return NextResponse.json(
        { error: "กรุณาระบุปีและเดือน" },
        { status: 400 }
      );
    }

    await prisma.monthlyClose.delete({
      where: { year_month: { year, month } },
    });

    // ลบ MonthlySummary ด้วย (ถ้ามี)
    await prisma.monthlySummary.deleteMany({
      where: { year, month },
    });

    return NextResponse.json(
      { message: `เปิดเดือน ${month}/${year} สำเร็จ` }
    );
  } catch (error) {
    console.error("DELETE /api/monthly-close error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
