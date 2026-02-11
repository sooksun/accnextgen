import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { generateOrderCode } from "@/src/lib/docNumber";
import { calculateVat, round2 } from "@/src/lib/tax";
import { z } from "zod";

const orderItemSchema = z.object({
  name: z.string().min(1),
  unit: z.string().default("ชิ้น"),
  qty: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  productId: z.string().optional(),
});

const createOrderSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  orderDate: z.string().optional(),
  vatRate: z.number().min(0).default(7),
  note: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "กรุณาเพิ่มรายการอย่างน้อย 1 รายการ"),
});

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          items: true,
          shipment: true,
          _count: { select: { payments: true, documents: true } },
        },
        orderBy: { orderDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, orderDate, ...orderData } = parsed.data;
    const date = orderDate ? new Date(orderDate) : new Date();
    const code = await generateOrderCode(date);

    // Calculate totals
    const processedItems = items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice,
      lineTotal: round2(item.qty * item.unitPrice),
    }));
    const subTotal = round2(
      processedItems.reduce((sum, item) => sum + item.lineTotal, 0)
    );
    const vatAmount = calculateVat(subTotal, orderData.vatRate);
    const grandTotal = round2(subTotal + vatAmount);

    const order = await prisma.order.create({
      data: {
        code,
        customerId: orderData.customerId,
        orderDate: date,
        vatRate: orderData.vatRate,
        note: orderData.note,
        subTotal,
        vatAmount,
        grandTotal,
        items: {
          create: processedItems,
        },
      },
      include: {
        customer: { select: { name: true } },
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
