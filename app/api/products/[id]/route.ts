import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const updateProductSchema = z.object({
  sku: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.enum(["GOODS", "SERVICE"]).optional(),
  groupId: z.string().optional().nullable(),
  unit: z.string().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  discount: z.number().min(0).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  scrapedAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/products/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { group: { select: { id: true, name: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/products/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scrapedAt, ...rest } = parsed.data;
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(scrapedAt !== undefined ? { scrapedAt: scrapedAt ? new Date(scrapedAt) : null } : {}),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
