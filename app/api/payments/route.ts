import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { assertNotClosed, MonthClosedError } from "@/src/lib/monthLock";
import { z } from "zod";

const createPaymentSchema = z.object({
  receivedAt: z.string().optional(),
  method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]).default("TRANSFER"),
  amount: z.number().min(0),
  note: z.string().optional(),
  orderId: z.string().optional(),
  documentId: z.string().optional(),
});

// GET /api/payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const documentId = searchParams.get("documentId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (orderId) where.orderId = orderId;
    if (documentId) where.documentId = documentId;
    if (from || to) {
      where.receivedAt = {};
      if (from) (where.receivedAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.receivedAt as Record<string, unknown>).lte = new Date(to);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: { select: { code: true } },
          document: { select: { number: true, type: true } },
        },
        orderBy: { receivedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/payments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { receivedAt, ...data } = parsed.data;
    const date = receivedAt ? new Date(receivedAt) : new Date();

    // Month lock guard
    try {
      await assertNotClosed(date);
    } catch (e) {
      if (e instanceof MonthClosedError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const payment = await prisma.payment.create({
      data: {
        ...data,
        receivedAt: date,
      },
      include: {
        order: { select: { code: true } },
        document: { select: { number: true, type: true } },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
