import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const createUnitSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  name: z.string().min(1, "กรุณากรอกชื่อหน่วยงาน"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

const updateUnitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
});

// GET /api/customer-units?customerId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;

    const units = await prisma.customerUnit.findMany({
      where,
      include: { customer: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("GET /api/customer-units error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/customer-units
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createUnitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const unit = await prisma.customerUnit.create({
      data: parsed.data,
      include: { customer: { select: { name: true } } },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error("POST /api/customer-units error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/customer-units
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateUnitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const unit = await prisma.customerUnit.update({
      where: { id },
      data,
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error("PUT /api/customer-units error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/customer-units
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ id" }, { status: 400 });
    }

    await prisma.customerUnit.delete({ where: { id } });
    return NextResponse.json({ message: "ลบหน่วยงานสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/customer-units error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
