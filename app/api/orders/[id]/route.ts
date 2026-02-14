import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { calculateVat, round2 } from "@/src/lib/tax";
import { z } from "zod";

const updateOrderSchema = z.object({
  status: z.enum(["DRAFT", "INVOICED", "PAID", "CLOSED", "VOID"]).optional(),
  vatRate: z.number().min(0).optional(),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        qty: z.number().int().min(1).default(1),
        unitPrice: z.number().min(0),
      })
    )
    .optional(),
  shipment: z
    .object({
      carrier: z.string().min(1),
      trackingNo: z.string().optional(),
      shippedAt: z.string().optional(),
      shippingFee: z.number().optional(),
    })
    .optional()
    .nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/orders/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        shipment: true,
        payments: true,
        documents: true,
        attachments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลออเดอร์" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/orders/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, shipment, ...orderData } = parsed.data;

    // If items provided, recalculate totals
    let totals = {};
    if (items) {
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        select: { vatRate: true },
      });
      const vatRate = orderData.vatRate ?? Number(existingOrder?.vatRate ?? 7);

      const processedItems = items.map((item) => ({
        ...item,
        lineTotal: round2(item.qty * item.unitPrice),
      }));
      const subTotal = round2(
        processedItems.reduce((sum, item) => sum + item.lineTotal, 0)
      );
      const vatAmount = calculateVat(subTotal, vatRate);
      const grandTotal = round2(subTotal + vatAmount);

      // Delete old items and create new
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.orderItem.createMany({
        data: processedItems.map(({ id: _id, ...item }) => ({
          ...item,
          orderId: id,
        })),
      });

      totals = { subTotal, vatAmount, grandTotal, vatRate };
    }

    // Handle shipment
    if (shipment !== undefined) {
      if (shipment === null) {
        await prisma.shipment.deleteMany({ where: { orderId: id } });
      } else {
        await prisma.shipment.upsert({
          where: { orderId: id },
          create: {
            orderId: id,
            ...shipment,
            shippedAt: shipment.shippedAt
              ? new Date(shipment.shippedAt)
              : undefined,
          },
          update: {
            ...shipment,
            shippedAt: shipment.shippedAt
              ? new Date(shipment.shippedAt)
              : undefined,
          },
        });
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: { ...orderData, ...totals },
      include: {
        customer: { select: { name: true } },
        items: true,
        shipment: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/orders/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ message: "ลบออเดอร์สำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
