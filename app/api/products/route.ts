import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  sku: z.string().optional().nullable(),
  name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  description: z.string().optional().nullable(),
  category: z.enum(["GOODS", "SERVICE"]).default("GOODS"),
  groupId: z.string().optional().nullable(),
  unit: z.string().min(1).default("ชิ้น"),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  scrapedAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category");
    const groupId = searchParams.get("groupId");
    const activeOnly = searchParams.get("active") !== "false";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (activeOnly) where.isActive = true;
    if (category) where.category = category;
    if (groupId) where.groupId = groupId === "none" ? null : groupId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { group: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scrapedAt, ...rest } = parsed.data;
    const product = await prisma.product.create({
      data: {
        ...rest,
        scrapedAt: scrapedAt ? new Date(scrapedAt) : undefined,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
