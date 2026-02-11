import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { assertNotClosed, MonthClosedError } from "@/src/lib/monthLock";
import { z } from "zod";

const createExpenseSchema = z.object({
  expenseDate: z.string().optional(),
  vendorName: z.string().min(1, "กรุณากรอกชื่อผู้ขาย/ร้านค้า"),
  category: z.enum([
    "INVENTORY_PURCHASE",
    "SHIPPING_OUT",
    "PLATFORM_FEE",
    "MARKETING",
    "SOFTWARE_CLOUD",
    "SALARY_FREELANCE",
    "TRAVEL_COMM",
    "OFFICE_SUPPLIES",
    "OTHER",
  ]),
  description: z.string().optional(),
  hasVat: z.boolean().default(false),
  subTotal: z.number().min(0),
  vatRate: z.number().min(0).default(7),
  vatAmount: z.number().min(0),
  grandTotal: z.number().min(0),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]).default("TRANSFER"),
  paidAmount: z.number().optional(),
  relatedOrderId: z.string().optional(),
  relatedProjectId: z.string().optional(),
});

// GET /api/expenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { vendorName: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (from || to) {
      where.expenseDate = {};
      if (from) (where.expenseDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.expenseDate as Record<string, unknown>).lte = new Date(to);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          _count: { select: { attachments: true } },
        },
        orderBy: { expenseDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      data: expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { expenseDate, ...data } = parsed.data;
    const date = expenseDate ? new Date(expenseDate) : new Date();

    // Month lock guard
    try {
      await assertNotClosed(date);
    } catch (e) {
      if (e instanceof MonthClosedError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const expense = await prisma.expense.create({
      data: {
        ...data,
        expenseDate: date,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().min(1, "ต้องการ ID ของค่าใช้จ่าย"),
});

// PUT /api/expenses (body: { id, ... })
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, expenseDate, ...data } = parsed.data;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบค่าใช้จ่าย" }, { status: 404 });
    }

    const date = expenseDate ? new Date(expenseDate) : existing.expenseDate;
    try {
      await assertNotClosed(date);
    } catch (e) {
      if (e instanceof MonthClosedError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
        expenseDate: date,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("PUT /api/expenses error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/expenses?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ต้องการ id ของค่าใช้จ่าย" }, { status: 400 });
    }

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบค่าใช้จ่าย" }, { status: 404 });
    }

    try {
      await assertNotClosed(existing.expenseDate);
    } catch (e) {
      if (e instanceof MonthClosedError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/expenses error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
