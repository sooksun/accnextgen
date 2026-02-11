import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่"),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/product-groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";
    const withCount = searchParams.get("count") === "true";

    const where: Record<string, unknown> = {};
    if (activeOnly) where.isActive = true;

    const groups = await prisma.productGroup.findMany({
      where,
      include: withCount ? { _count: { select: { products: true } } } : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ data: groups });
  } catch (error) {
    console.error("GET /api/product-groups error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/product-groups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const group = await prisma.productGroup.create({ data: parsed.data });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("POST /api/product-groups error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/product-groups — update by id in body
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
    }

    const parsed = updateGroupSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const group = await prisma.productGroup.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("PUT /api/product-groups error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/product-groups
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
    }

    // Unlink products first (set groupId to null)
    await prisma.product.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    await prisma.productGroup.delete({ where: { id } });
    return NextResponse.json({ message: "ลบหมวดหมู่สำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/product-groups error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
